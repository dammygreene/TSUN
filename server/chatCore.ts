import { buildSystemPrompt, type PersonaContext, type TsunMood, type VerifiedFacts } from './tsunPersona.ts'

export type ChatRole = 'user' | 'tsun' | 'system'
export interface HistoryItem { role: ChatRole; body: string; mood?: string }

export interface ChatCoreRequest {
  prompt: string
  history: HistoryItem[]
  mood: TsunMood
  relationship: import('./tsunPersona.ts').RelationshipLevel
  interactionCount: number
  notes: string[]
  discussedAssets: string[]
  facts: VerifiedFacts
}

export interface ChatCoreResponse {
  reply: string
  mood: TsunMood
  memoryNote?: string | null
  source: 'openrouter' | 'gemini' | 'fallback'
  model?: string
}

const ALLOWED_MOODS: TsunMood[] = ['NORMAL','ANNOYED','ANGRY','FURIOUS','SMUG','EMBARRASSED','FLUSTERED','HAPPY','PANICKING','DERE']

function sanitizeMood(m: string, fallback: TsunMood): TsunMood {
  const up = m?.toUpperCase?.() as TsunMood
  return (ALLOWED_MOODS as string[]).includes(up) ? up : fallback
}

function extractJson(text: string): any {
  // Try direct JSON parse
  try { return JSON.parse(text) } catch {}
  // Try to find JSON object in text
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
  }
  return null
}

function buildMessages(req: ChatCoreRequest) {
  const system = buildSystemPrompt({
    mood: req.mood,
    relationship: req.relationship,
    interactionCount: req.interactionCount,
    notes: req.notes,
    discussedAssets: req.discussedAssets,
    facts: req.facts,
  })

  // Map history to OpenAI-style
  const historyMessages = req.history.slice(-12).map((h) => {
    if (h.role === 'user') return { role: 'user' as const, content: h.body }
    if (h.role === 'tsun') return { role: 'assistant' as const, content: h.body }
    return { role: 'system' as const, content: h.body }
  })

  return { system, historyMessages }
}

function buildGeminiContents(req: ChatCoreRequest) {
  const { historyMessages } = buildMessages(req)
  // Convert to Gemini format
  const contents = historyMessages.map((m) => {
    if (m.role === 'user') return { role: 'user', parts: [{ text: m.content }] }
    if (m.role === 'assistant') return { role: 'model', parts: [{ text: m.content }] }
    // system messages become user with prefix
    return { role: 'user', parts: [{ text: `[SYSTEM NOTE] ${m.content}` }] }
  })
  // Add current prompt
  contents.push({ role: 'user', parts: [{ text: req.prompt }] })
  return contents
}

async function callOpenRouter(req: ChatCoreRequest, env: Record<string, string>): Promise<ChatCoreResponse | null> {
  const key = env.OPENROUTER_API_KEY?.trim()
  if (!key) return null
  const primaryModel = env.OPENROUTER_MODEL?.trim() || 'anthropic/claude-sonnet-4.5'
  const fallbackModelsRaw = env.OPENROUTER_FALLBACK_MODELS?.trim() || 'google/gemini-2.5-flash,anthropic/claude-haiku-4.5'
  const fallbackModels = fallbackModelsRaw.split(',').map(s=>s.trim()).filter(Boolean)
  const siteUrl = env.OPENROUTER_SITE_URL?.trim() || 'https://tsun-os.local'
  const appTitle = env.OPENROUTER_APP_TITLE?.trim() || 'TSUN//OS'

  const { system, historyMessages } = buildMessages(req)

  const body: any = {
    model: primaryModel,
    messages: [
      { role: 'system', content: system },
      ...historyMessages,
      { role: 'user', content: req.prompt },
    ],
    temperature: 0.85,
    top_p: 0.92,
    max_tokens: 600,
    response_format: { type: 'json_object' },
    provider: { allow_fallbacks: true, sort: 'latency' },
  }
  // OpenRouter model fallbacks via models array
  if (fallbackModels.length) {
    body.models = [primaryModel, ...fallbackModels]
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': siteUrl,
        'X-Title': appTitle,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const txt = await res.text().catch(()=> '')
      console.error('[openrouter] status', res.status, txt.slice(0, 500))
      return null
    }
    const data = await res.json() as any
    const content = data?.choices?.[0]?.message?.content
    if (!content) return null
    const parsed = typeof content === 'string' ? extractJson(content) : content
    if (!parsed?.reply) return null
    return {
      reply: String(parsed.reply).slice(0, 1200),
      mood: sanitizeMood(parsed.mood, req.mood),
      memoryNote: parsed.memoryNote ? String(parsed.memoryNote).slice(0, 120) : null,
      source: 'openrouter',
      model: data?.model || primaryModel,
    }
  } catch (e) {
    console.error('[openrouter] error', e)
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function callGemini(req: ChatCoreRequest, env: Record<string, string>): Promise<ChatCoreResponse | null> {
  const key = env.GEMINI_API_KEY?.trim()
  if (!key) return null
  const model = env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'

  const { system } = buildMessages(req)
  const contents = buildGeminiContents(req)

  const isGemini3 = /gemini-3\./.test(model) || /gemini-3\.8|gemini-3\.7|gemini-3\.6|gemini-3\.5/.test(model)
  const generationConfig: any = {
    temperature: 0.85,
    maxOutputTokens: 600,
    responseMimeType: 'application/json',
  }
  if (isGemini3) {
    generationConfig.thinkingConfig = { thinkingLevel: 'low' }
  } else {
    // Gemini 2.5 uses thinkingBudget
    generationConfig.thinkingConfig = { thinkingBudget: 0 }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig,
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      const txt = await res.text().catch(()=> '')
      console.error('[gemini] status', res.status, txt.slice(0, 800))
      return null
    }
    const data = await res.json() as any
    // Gemini returns candidates[0].content.parts[0].text
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.error('[gemini] no text', JSON.stringify(data).slice(0, 800))
      return null
    }
    const parsed = extractJson(text)
    if (!parsed?.reply) return null
    return {
      reply: String(parsed.reply).slice(0, 1200),
      mood: sanitizeMood(parsed.mood, req.mood),
      memoryNote: parsed.memoryNote ? String(parsed.memoryNote).slice(0, 120) : null,
      source: 'gemini',
      model,
    }
  } catch (e) {
    console.error('[gemini] error', e)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function handleChatCore(req: ChatCoreRequest, env: Record<string, string>): Promise<ChatCoreResponse | null> {
  // Try OpenRouter first
  const or = await callOpenRouter(req, env)
  if (or) return or
  const gm = await callGemini(req, env)
  if (gm) return gm
  return null
}
