import type { ChatMessage, MarketState, TokenState, TsunMood, UserMemory, WalletState, RelationshipLevel } from '../types'
import { respondAsTsun } from './tsun'

export interface ChatHistoryItem { role: 'user'|'tsun'|'system'; body: string; mood?: string }

export interface VerifiedFacts {
  sol?: { priceUsd: number; change24h: number } | null
  btc?: { priceUsd: number; change24h: number } | null
  marketStatus: string
  marketFetchedAt: string | null
  marketError: string | null
  token?: { priceUsd: number | null; change24h: number | null; marketCap: number | null; volume24h: number | null; liquidityUsd: number | null; pairLabel: string | null; status: string; fetchedAt: string | null; error: string | null; addressConfigured: boolean } | null
  wallet?: { address: string | null; solBalance: number | null; fetchedAt: string | null; error: string | null } | null
}

export interface ChatCoreRequest {
  prompt: string
  history: ChatHistoryItem[]
  mood: TsunMood
  relationship: RelationshipLevel
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

function buildFacts(market: MarketState, token: TokenState, wallet: WalletState): VerifiedFacts {
  return {
    sol: market.assets.solana ? { priceUsd: market.assets.solana.priceUsd, change24h: market.assets.solana.change24h } : null,
    btc: market.assets.bitcoin ? { priceUsd: market.assets.bitcoin.priceUsd, change24h: market.assets.bitcoin.change24h } : null,
    marketStatus: market.status,
    marketFetchedAt: market.fetchedAt,
    marketError: market.error,
    token: {
      priceUsd: token.priceUsd,
      change24h: token.change24h,
      marketCap: token.marketCap,
      volume24h: token.volume24h,
      liquidityUsd: token.liquidityUsd,
      pairLabel: token.pairLabel,
      status: token.status,
      fetchedAt: token.fetchedAt,
      error: token.error,
      addressConfigured: !!token.address,
    },
    wallet: {
      address: wallet.address,
      solBalance: wallet.solBalance,
      fetchedAt: wallet.balanceFetchedAt,
      error: wallet.error,
    },
  }
}

function buildHistory(messages: ChatMessage[]): ChatHistoryItem[] {
  return messages.slice(-14).map((m) => ({
    role: m.role,
    body: m.body,
    mood: m.mood,
  }))
}

export async function requestTsunReply({
  prompt,
  messages,
  mood,
  memory,
  market,
  token,
  wallet,
}: {
  prompt: string
  messages: ChatMessage[]
  mood: TsunMood
  memory: UserMemory
  market: MarketState
  token: TokenState
  wallet: WalletState
}): Promise<{ reply: string; mood: TsunMood; memoryNote?: string | null; source: 'openrouter'|'gemini'|'fallback'; toolCard?: ReturnType<typeof respondAsTsun>['toolCard'] }> {
  const facts = buildFacts(market, token, wallet)
  const history = buildHistory(messages)

  const payload: ChatCoreRequest = {
    prompt,
    history,
    mood,
    relationship: memory.relationship as RelationshipLevel,
    interactionCount: memory.interactionCount,
    notes: memory.notes,
    discussedAssets: memory.discussedAssets,
    facts,
  }

  // Try server LLM proxy first
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 16000)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (res.ok) {
      const data = (await res.json()) as ChatCoreResponse
      if (data?.reply) {
        // Still compute deterministic tool card for verified context
        const deterministic = respondAsTsun({ prompt, memory, market, token, wallet })
        return {
          reply: data.reply,
          mood: data.mood,
          memoryNote: data.memoryNote,
          source: data.source,
          toolCard: deterministic.toolCard,
        }
      }
    }
    // If server returned 503 fallback, go to deterministic
  } catch (e) {
    console.warn('[chatService] LLM proxy failed, using deterministic fallback', e)
  }

  // Offline deterministic fallback
  const fallback = respondAsTsun({ prompt, memory, market, token, wallet })
  return {
    reply: fallback.body,
    mood: fallback.mood,
    memoryNote: fallback.memoryNotes?.[0] ?? null,
    source: 'fallback',
    toolCard: fallback.toolCard,
  }
}
