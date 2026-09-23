/**
 * Provider layer. OpenRouter is primary, Gemini direct is the fallback.
 *
 * Keys are read from non VITE_ environment variables only, so they stay on the server and are never
 * exposed to the browser bundle. See README.md ("Model link") and .env.example.
 */

export interface ProviderEnv {
  OPENROUTER_API_KEY?: string
  OPENROUTER_MODEL?: string
  OPENROUTER_FALLBACK_MODELS?: string
  OPENROUTER_SITE_URL?: string
  OPENROUTER_BASE_URL?: string
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  GEMINI_FALLBACK_MODELS?: string
  GEMINI_BASE_URL?: string
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export type ProviderName = 'openrouter' | 'gemini'

export interface ProviderSuccess {
  ok: true
  provider: ProviderName
  model: string
  text: string
}

export interface ProviderFailure {
  ok: false
  provider: ProviderName
  error: string
}

export interface ProviderAttempt {
  provider: ProviderName
  model: string
  error: string
}

export const DEFAULT_OPENROUTER_MODELS = ['deepseek/deepseek-chat-v3.1', 'x-ai/grok-4-fast', 'google/gemini-2.5-flash']
export const DEFAULT_GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-2.5-flash']

const REQUEST_TIMEOUT_MS = 22_000

/** Optional overrides, handy for gateways, proxies and local integration checks. */
const openRouterUrl = (env: ProviderEnv) => `${(env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1').replace(/\/$/, '')}/chat/completions`
const geminiUrl = (env: ProviderEnv, model: string) =>
  `${(env.GEMINI_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '')}/models/${encodeURIComponent(model)}:generateContent`

function parseList(value: string | undefined, fallback: string[]) {
  const listed = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return listed.length ? listed : fallback
}

export function openRouterModels(env: ProviderEnv) {
  const primary = env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODELS[0]
  const rest = parseList(env.OPENROUTER_FALLBACK_MODELS, DEFAULT_OPENROUTER_MODELS.slice(1))
  return Array.from(new Set([primary, ...rest]))
}

export function geminiModels(env: ProviderEnv) {
  return Array.from(new Set([env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODELS[0], ...parseList(env.GEMINI_FALLBACK_MODELS, DEFAULT_GEMINI_MODELS.slice(1))]))
}

export function providerStatus(env: ProviderEnv) {
  return {
    openrouter: { configured: Boolean(env.OPENROUTER_API_KEY?.trim()), models: openRouterModels(env) },
    gemini: { configured: Boolean(env.GEMINI_API_KEY?.trim()), models: geminiModels(env) },
    local: { configured: true, models: ['tsun-local-character-engine'] },
  }
}

function textFromContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : typeof (part as { text?: unknown })?.text === 'string' ? (part as { text: string }).text : ''))
      .join('')
  }
  return ''
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<{ status: number; payload: unknown }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const text = await response.text()
  let payload: unknown = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = { raw: text.slice(0, 400) }
  }
  return { status: response.status, payload }
}

function errorMessage(payload: unknown, status: number) {
  const maybe = payload as { error?: { message?: unknown } | string; message?: unknown } | null
  if (typeof maybe?.error === 'string') return maybe.error
  if (maybe?.error && typeof maybe.error === 'object' && typeof maybe.error.message === 'string') return maybe.error.message
  if (typeof maybe?.message === 'string') return maybe.message
  return `Provider returned ${status}`
}

/** One OpenRouter call. The models array plus route fallback lets OpenRouter walk the chain itself. */
async function callOpenRouter(system: string, turns: ChatTurn[], env: ProviderEnv): Promise<ProviderSuccess | ProviderFailure> {
  const models = openRouterModels(env)
  const messages = [{ role: 'system', content: system }, ...turns]
  const baseBody = {
    model: models[0],
    messages,
    temperature: 0.95,
    top_p: 0.95,
    max_tokens: 450,
  }

  try {
    let { status, payload } = await postJson(
      openRouterUrl(env),
      {
        authorization: `Bearer ${env.OPENROUTER_API_KEY?.trim()}`,
        'http-referer': env.OPENROUTER_SITE_URL?.trim() || 'https://tsun.local',
        'x-openrouter-title': 'TSUN//OS',
      },
      models.length > 1 ? { ...baseBody, models, route: 'fallback' } : baseBody,
    )

    // Some providers reject the routing extras. Retry once with the primary model only.
    if (status >= 400 && models.length > 1) {
      const retry = await postJson(
        openRouterUrl(env),
        {
          authorization: `Bearer ${env.OPENROUTER_API_KEY?.trim()}`,
          'http-referer': env.OPENROUTER_SITE_URL?.trim() || 'https://tsun.local',
          'x-openrouter-title': 'TSUN//OS',
        },
        baseBody,
      )
      status = retry.status
      payload = retry.payload
    }

    if (status >= 400) return { ok: false, provider: 'openrouter', error: errorMessage(payload, status) }
    const data = payload as { choices?: Array<{ message?: { content?: unknown } }>; error?: unknown } | null
    if (data?.error) return { ok: false, provider: 'openrouter', error: errorMessage(payload, status) }
    const text = textFromContent(data?.choices?.[0]?.message?.content)
    if (!text.trim()) return { ok: false, provider: 'openrouter', error: 'OpenRouter returned an empty completion' }
    return { ok: true, provider: 'openrouter', model: models[0], text }
  } catch (error) {
    return { ok: false, provider: 'openrouter', error: error instanceof Error ? error.message : 'OpenRouter request failed' }
  }
}

/** One Gemini generateContent call per model in the Gemini chain. */
async function callGemini(system: string, turns: ChatTurn[], env: ProviderEnv): Promise<ProviderSuccess | ProviderFailure> {
  const models = geminiModels(env)
  let lastError = 'Gemini request failed'

  for (const model of models) {
    try {
      const { status, payload } = await postJson(
        geminiUrl(env, model),
        { 'x-goog-api-key': env.GEMINI_API_KEY?.trim() ?? '' },
        {
          system_instruction: { parts: [{ text: system }] },
          contents: turns.map((turn) => ({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.content }] })),
          generationConfig: { temperature: 0.95, topP: 0.95, maxOutputTokens: 450 },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        },
      )

      if (status >= 400) {
        lastError = errorMessage(payload, status)
        continue
      }

      const data = payload as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>
        promptFeedback?: { blockReason?: string }
      } | null

      if (data?.promptFeedback?.blockReason) {
        lastError = `Gemini blocked the prompt (${data.promptFeedback.blockReason})`
        continue
      }

      const text = (data?.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('')
      if (!text.trim()) {
        lastError = 'Gemini returned an empty completion'
        continue
      }
      return { ok: true, provider: 'gemini', model, text }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Gemini request failed'
    }
  }

  return { ok: false, provider: 'gemini', error: lastError }
}

export interface ChainOutcome {
  result: ProviderSuccess | null
  attempts: ProviderAttempt[]
}

/**
 * Walks the provider chain in the order the product requires: OpenRouter, then Gemini.
 * A provider without a key is skipped and reported, never silently treated as success.
 */
export async function runProviderChain(system: string, turns: ChatTurn[], env: ProviderEnv): Promise<ChainOutcome> {
  const attempts: ProviderAttempt[] = []

  if (env.OPENROUTER_API_KEY?.trim()) {
    const result = await callOpenRouter(system, turns, env)
    if (result.ok) return { result, attempts }
    attempts.push({ provider: 'openrouter', model: openRouterModels(env)[0], error: result.error })
  } else {
    attempts.push({ provider: 'openrouter', model: '-', error: 'No OPENROUTER_API_KEY configured' })
  }

  if (env.GEMINI_API_KEY?.trim()) {
    const result = await callGemini(system, turns, env)
    if (result.ok) return { result, attempts }
    attempts.push({ provider: 'gemini', model: geminiModels(env)[0], error: result.error })
  } else {
    attempts.push({ provider: 'gemini', model: '-', error: 'No GEMINI_API_KEY configured' })
  }

  return { result: null, attempts }
}
