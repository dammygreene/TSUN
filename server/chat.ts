/**
 * Chat orchestrator for TALK TO TSUN.
 *
 * Order of operations, matching build-prompt.md section 8:
 *   request -> fact block (truth guard) -> persona prompt -> OpenRouter -> Gemini -> validation.
 * If every provider is unavailable the handler reports failure and the browser falls back to the
 * local deterministic character engine in src/lib/tsun.ts, so chat never dies in silence.
 */

import type { ChatSnapshot } from './facts'
import { auditReply, buildFactBlock } from './facts'
import type { ChainOutcome, ChatTurn, ProviderEnv } from './providers'
import { DEFAULT_GEMINI_MODELS, DEFAULT_OPENROUTER_MODELS, providerStatus, runProviderChain } from './providers'
import { cleanReply, parseMoodTag, buildSystemPrompt } from './persona'
import type { PersonaState } from './persona'
import { TSUN_MOODS } from './persona'

export interface ChatRequestPayload {
  prompt?: unknown
  history?: unknown
  context?: unknown
}

export interface ChatSuccess {
  ok: true
  body: string
  mood: string
  provider: 'openrouter' | 'gemini'
  model: string
  usedFallbackModel: boolean
  attempts: ChainOutcome['attempts']
}

export interface ChatFailure {
  ok: false
  code: 'bad_request' | 'no_provider' | 'providers_unavailable' | 'unsafe_reply'
  error: string
  attempts: ChainOutcome['attempts']
}

export type ChatResult = ChatSuccess | ChatFailure

const MAX_PROMPT = 1200
const MAX_HISTORY = 10
const MAX_TURN_LENGTH = 700

function asString(value: unknown, limit = MAX_TURN_LENGTH) {
  return typeof value === 'string' ? value.slice(0, limit).trim() : ''
}

function sanitizeHistory(history: unknown): ChatTurn[] {
  if (!Array.isArray(history)) return []
  const turns: ChatTurn[] = []
  for (const entry of history.slice(-MAX_HISTORY)) {
    const item = entry as { role?: unknown; body?: unknown }
    const body = asString(item?.body)
    if (!body) continue
    const role = item?.role === 'user' ? 'user' : 'assistant'
    turns.push({ role, content: body })
  }
  // The first turn must come from the user so strict providers accept the conversation.
  while (turns.length && turns[0].role === 'assistant') turns.shift()
  return turns
}

function sanitizeSnapshot(context: unknown): ChatSnapshot {
  const raw = (context && typeof context === 'object' ? context : {}) as ChatSnapshot
  const numeric = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null)
  const stringList = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 6) : [])

  return {
    mood: typeof raw.mood === 'string' && TSUN_MOODS.includes(raw.mood as never) ? raw.mood : 'ANNOYED',
    relationship: typeof raw.relationship === 'string' ? raw.relationship : 'STRANGER',
    interactionCount: numeric(raw.interactionCount) ?? 0,
    firstSeenAt: typeof raw.firstSeenAt === 'string' ? raw.firstSeenAt : null,
    lastSeenAt: typeof raw.lastSeenAt === 'string' ? raw.lastSeenAt : null,
    discussedAssets: stringList(raw.discussedAssets),
    notes: stringList(raw.notes),
    market: raw.market
      ? {
          status: raw.market.status,
          source: raw.market.source,
          fetchedAt: raw.market.fetchedAt ?? null,
          error: raw.market.error ?? null,
          solPrice: numeric(raw.market.solPrice),
          solChange24h: numeric(raw.market.solChange24h),
          btcPrice: numeric(raw.market.btcPrice),
          btcChange24h: numeric(raw.market.btcChange24h),
        }
      : undefined,
    token: raw.token
      ? {
          configured: Boolean(raw.token.configured),
          status: raw.token.status,
          fetchedAt: raw.token.fetchedAt ?? null,
          priceUsd: numeric(raw.token.priceUsd),
          change24h: numeric(raw.token.change24h),
          marketCap: numeric(raw.token.marketCap),
          volume24h: numeric(raw.token.volume24h),
          liquidityUsd: numeric(raw.token.liquidityUsd),
          pairLabel: raw.token.pairLabel ?? null,
          error: raw.token.error ?? null,
        }
      : undefined,
    wallet: raw.wallet
      ? {
          connected: Boolean(raw.wallet.connected),
          solBalance: numeric(raw.wallet.solBalance),
          balanceFetchedAt: raw.wallet.balanceFetchedAt ?? null,
          error: raw.wallet.error ?? null,
        }
      : undefined,
    portfolio: raw.portfolio
      ? {
          simulated: true,
          nav: numeric(raw.portfolio.nav),
          costBasis: numeric(raw.portfolio.costBasis),
          pnl: numeric(raw.portfolio.pnl),
          pnlPct: numeric(raw.portfolio.pnlPct),
          winRatePct: numeric(raw.portfolio.winRatePct),
          closedTrades: numeric(raw.portfolio.closedTrades),
        }
      : undefined,
  }
}

export async function handleChatRequest(payload: ChatRequestPayload, env: ProviderEnv): Promise<ChatResult> {
  const prompt = asString(payload.prompt, MAX_PROMPT)
  const attempts: ChainOutcome['attempts'] = []

  if (!prompt) {
    return { ok: false, code: 'bad_request', error: 'A prompt is required.', attempts }
  }

  const snapshot = sanitizeSnapshot(payload.context)
  const factBlock = buildFactBlock(snapshot)
  const state: PersonaState = {
    mood: snapshot.mood ?? 'ANNOYED',
    relationship: snapshot.relationship ?? 'STRANGER',
    interactionCount: snapshot.interactionCount ?? 0,
    discussedAssets: snapshot.discussedAssets ?? [],
    notes: snapshot.notes ?? [],
    firstSeenAt: snapshot.firstSeenAt ?? null,
    lastSeenAt: snapshot.lastSeenAt ?? null,
  }

  const system = buildSystemPrompt(factBlock.text, state)
  const turns = [...sanitizeHistory(payload.history), { role: 'user' as const, content: prompt }]

  const { result, attempts: providerAttempts } = await runProviderChain(system, turns, env)
  attempts.push(...providerAttempts)

  if (!result) {
    const anyKey = Boolean(env.OPENROUTER_API_KEY?.trim() || env.GEMINI_API_KEY?.trim())
    return {
      ok: false,
      code: anyKey ? 'providers_unavailable' : 'no_provider',
      error: anyKey
        ? 'OpenRouter and Gemini both failed. The browser will answer with the local character engine.'
        : 'No model provider is configured. Set OPENROUTER_API_KEY and optionally GEMINI_API_KEY.',
      attempts,
    }
  }

  const parsed = parseMoodTag(result.text, state.mood)
  const body = cleanReply(parsed.body)

  if (!body) {
    return { ok: false, code: 'providers_unavailable', error: 'The model returned an empty reply.', attempts }
  }

  const audit = auditReply(body, factBlock)
  if (!audit.ok) {
    return {
      ok: false,
      code: 'unsafe_reply',
      error: `Draft quoted unsupported values (${audit.offending.slice(0, 3).join(', ')}). Blocked by the truth guard.`,
      attempts,
    }
  }

  return {
    ok: true,
    body,
    mood: parsed.mood,
    provider: result.provider,
    model: result.model,
    usedFallbackModel: result.model !== (result.provider === 'openrouter' ? DEFAULT_OPENROUTER_MODELS[0] : DEFAULT_GEMINI_MODELS[0]),
    attempts,
  }
}

export { providerStatus }
