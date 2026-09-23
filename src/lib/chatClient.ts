import type { MarketState, TokenState, ToolCardData, TsunMood, UserMemory, WalletState } from '../types'
import type { ProviderInfo } from './providers'
import { respondAsTsun } from './tsun'

export interface ChatTurnInput {
  role: 'user' | 'tsun'
  body: string
}

export interface TsunChatReply {
  body: string
  mood: TsunMood
  toolCard?: ToolCardData
  memoryNotes?: string[]
  provider: ProviderInfo
}

interface ApiSuccess {
  ok: true
  body: string
  mood: string
  provider: 'openrouter' | 'gemini'
  model: string
  attempts: ProviderInfo['attempts']
}

interface ApiFailure {
  ok: false
  code: string
  error: string
  attempts?: ProviderInfo['attempts']
}

const MOODS: TsunMood[] = ['NORMAL', 'ANNOYED', 'ANGRY', 'FURIOUS', 'SMUG', 'EMBARRASSED', 'FLUSTERED', 'HAPPY', 'PANICKING', 'DERE']

/** Simulated desk numbers, mirrored from the portfolio app so TSUN can comment on her own book. */
const SIMULATED_PORTFOLIO = {
  simulated: true,
  nav: 7727.3,
  costBasis: 7727.1,
  pnl: 0.2,
  pnlPct: 0.003,
  winRatePct: 50,
  closedTrades: 1,
}

function buildContext(input: {
  mood: TsunMood
  memory: UserMemory
  market: MarketState
  token: TokenState
  wallet: WalletState
}) {
  const sol = input.market.assets.solana
  const btc = input.market.assets.bitcoin
  return {
    mood: input.mood,
    relationship: input.memory.relationship,
    interactionCount: input.memory.interactionCount,
    firstSeenAt: input.memory.firstSeenAt,
    lastSeenAt: input.memory.lastSeenAt,
    discussedAssets: input.memory.discussedAssets,
    notes: input.memory.notes,
    market: {
      status: input.market.status,
      source: input.market.source,
      fetchedAt: input.market.fetchedAt,
      error: input.market.error,
      solPrice: sol?.priceUsd ?? null,
      solChange24h: sol?.change24h ?? null,
      btcPrice: btc?.priceUsd ?? null,
      btcChange24h: btc?.change24h ?? null,
    },
    token: {
      configured: Boolean(input.token.address),
      status: input.token.status,
      fetchedAt: input.token.fetchedAt,
      priceUsd: input.token.priceUsd,
      change24h: input.token.change24h,
      marketCap: input.token.marketCap,
      volume24h: input.token.volume24h,
      liquidityUsd: input.token.liquidityUsd,
      pairLabel: input.token.pairLabel,
      error: input.token.error,
    },
    wallet: {
      connected: Boolean(input.wallet.address),
      solBalance: input.wallet.solBalance,
      balanceFetchedAt: input.wallet.balanceFetchedAt,
      error: input.wallet.error,
    },
    portfolio: SIMULATED_PORTFOLIO,
  }
}

/**
 * One turn of TALK TO TSUN.
 *
 * The server owns the persona, the fact block and the OpenRouter then Gemini chain. If the server or
 * both providers are unavailable, the deterministic local character engine answers instead so the
 * conversation keeps the same voice offline.
 */
export async function requestTsunReply(args: {
  prompt: string
  history: ChatTurnInput[]
  mood: TsunMood
  memory: UserMemory
  market: MarketState
  token: TokenState
  wallet: WalletState
}): Promise<TsunChatReply> {
  const { prompt, history, mood, memory, market, token, wallet } = args
  const local = (reason: string, attempts: ProviderInfo['attempts'] = []): TsunChatReply => {
    const reply = respondAsTsun({ prompt, memory, market, token, wallet })
    return {
      body: reply.body,
      mood: reply.mood,
      toolCard: reply.toolCard,
      memoryNotes: reply.memoryNotes,
      provider: { provider: 'local', model: 'local character engine', attempts: [...attempts, { provider: 'local', model: 'tsun-local-character-engine', error: reason }], at: new Date().toISOString() },
    }
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 30_000)
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt,
        history: history.slice(-10).map((turn) => ({ role: turn.role === 'tsun' ? 'assistant' : 'user', body: turn.body })),
        context: buildContext({ mood, memory, market, token, wallet }),
      }),
      signal: controller.signal,
    })

    const payload = (await response.json()) as ApiSuccess | ApiFailure
    if (!response.ok || !payload.ok) {
      const failure = payload as ApiFailure
      return local(failure.error ?? `Model link returned ${response.status}`, failure.attempts ?? [])
    }

    const success = payload as ApiSuccess
    return {
      body: success.body,
      mood: MOODS.includes(success.mood as TsunMood) ? (success.mood as TsunMood) : mood,
      provider: { provider: success.provider, model: success.model, attempts: success.attempts ?? [], at: new Date().toISOString() },
    }
  } catch (error) {
    return local(error instanceof Error ? error.message : 'Model link unreachable')
  } finally {
    window.clearTimeout(timer)
  }
}
