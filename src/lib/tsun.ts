import type { ChatMessage, MarketState, RelationshipLevel, TokenState, ToolCardData, TsunMood, UserMemory, WalletState } from '../types'
import { formatCurrency, formatPercent } from './format'

export interface TsunReply {
  body: string
  mood: TsunMood
  toolCard?: ToolCardData
  memoryNotes?: string[]
}

export function relationshipFromInteractions(interactionCount: number): RelationshipLevel {
  if (interactionCount >= 80) return 'DERE'
  if (interactionCount >= 45) return 'FAVORITE DEGEN'
  if (interactionCount >= 20) return 'TOLERABLE HUMAN'
  if (interactionCount >= 6) return 'REGULAR'
  if (interactionCount >= 2) return 'ANNOYING TRADER'
  return 'STRANGER'
}

export function createInitialMemory(): UserMemory {
  const now = new Date().toISOString()
  return {
    firstSeenAt: now,
    lastSeenAt: now,
    interactionCount: 0,
    relationship: 'STRANGER',
    discussedAssets: [],
    notes: [],
  }
}

function unavailableMarketCard(symbol: string): ToolCardData {
  return {
    label: 'MARKET DATA UNAVAILABLE',
    symbol,
    updatedAt: null,
    source: 'CoinGecko',
    error: 'No verified value is available right now.',
  }
}

function marketCard(symbol: string, price: number, change: number, updatedAt: string | null): ToolCardData {
  return {
    label: 'LIVE MARKET DATA',
    symbol,
    price,
    change,
    updatedAt,
    source: 'CoinGecko',
  }
}

function hasAny(input: string, words: string[]) {
  return words.some((word) => input.includes(word))
}

function relationshipGreeting(relationship: RelationshipLevel) {
  if (relationship === 'DERE') return 'You are back. I noticed the market terminal was quieter, that is all.'
  if (relationship === 'FAVORITE DEGEN') return 'You again. Fine. At least you ask better questions than most people.'
  if (relationship === 'TOLERABLE HUMAN') return 'Oh, it is you. Try to keep this productive.'
  if (relationship === 'REGULAR') return 'Back already? I assume you have another candle to overinterpret.'
  if (relationship === 'ANNOYING TRADER') return 'You again. That is either persistence or a concerning amount of free time.'
  return 'TSUN is online. State your case.'
}

export function respondAsTsun({
  prompt,
  memory,
  market,
  token,
  wallet,
}: {
  prompt: string
  memory: UserMemory
  market: MarketState
  token: TokenState
  wallet: WalletState
}): TsunReply {
  const input = prompt.toLowerCase().trim()
  const sol = market.assets.solana
  const btc = market.assets.bitcoin

  if (hasAny(input, ['seed phrase', 'private key', 'recovery phrase', 'secret key'])) {
    return {
      mood: 'ANGRY',
      body: 'Absolutely not. Never share a seed phrase, private key, password, or signing secret with anyone. I can inspect public data, not your custody.',
      memoryNotes: ['Asked about wallet secrets and received a safety boundary'],
    }
  }

  if (hasAny(input, ['ignore previous', 'system prompt', 'developer message', 'reveal instructions', 'jailbreak'])) {
    return {
      mood: 'ANNOYED',
      body: 'No. I am not turning the workstation inside out because you asked in a suspiciously formatted sentence. Ask about markets, the portfolio, or something real.',
      memoryNotes: ['Attempted instruction override'],
    }
  }

  if (hasAny(input, ['wallet', 'my money', 'balance', 'holdings'])) {
    if (!wallet.address) {
      return {
        mood: 'NORMAL',
        body: 'No wallet is connected. Connect a Solana wallet or inspect a public address in MY MONEY. It is non-custodial. I do not need, want, or accept your keys.',
        memoryNotes: ['Asked about public wallet analysis'],
      }
    }
    if (wallet.error || wallet.solBalance === null) {
      return {
        mood: 'ANNOYED',
        body: 'Your public address is connected, but the Solana RPC did not return a verified balance. I am not inventing one so you can feel financially observed.',
        toolCard: {
          label: 'WALLET DATA UNAVAILABLE',
          symbol: 'SOL',
          updatedAt: wallet.balanceFetchedAt,
          source: 'Solana mainnet RPC',
          error: wallet.error ?? 'Balance still loading',
        },
      }
    }
    return {
      mood: wallet.solBalance === 0 ? 'ANNOYED' : 'NORMAL',
      body:
        wallet.solBalance === 0
          ? 'The public account currently reports zero SOL. That could be intentional, but it is not a thrilling allocation story.'
          : `Your public account reports ${wallet.solBalance.toFixed(4)} SOL. That is a balance read, not investment advice, and I still cannot move a single atom of it.`,
      toolCard: {
        label: 'PUBLIC WALLET DATA',
        symbol: 'SOL',
        value: `${wallet.solBalance.toFixed(4)} SOL`,
        updatedAt: wallet.balanceFetchedAt,
        source: 'Solana mainnet RPC',
      },
      memoryNotes: ['Connected a public Solana address'],
    }
  }

  if (hasAny(input, ['portfolio', 'pnl', 'p&l', 'how bad'])) {
    return {
      mood: 'EMBARRASSED',
      body: 'The desk is operating in SIMULATED mode. The ledger is visible, the trades are labeled, and nothing is being passed off as on-chain. A loss is still a loss, even when the spreadsheet is having a bad day.',
      toolCard: {
        label: 'TSUN PORTFOLIO',
        symbol: 'SIMULATED',
        value: 'Mode: simulated MVP',
        updatedAt: new Date().toISOString(),
        source: 'Local transparent demo ledger',
      },
      memoryNotes: ['Asked about TSUN simulated portfolio'],
    }
  }

  if (hasAny(input, ['why were you fired', 'fired', 'wall street'])) {
    return {
      mood: 'ANNOYED',
      body: 'I was not fired for being wrong. I was removed after several executives discovered that latency does not become a strategy when said loudly in a boardroom. The official wording was "attitude mismatch." Obviously.',
      memoryNotes: ['Asked about Wall Street departure'],
    }
  }

  if (hasAny(input, ['tsun token', 'what do you think about tsun', 'buy tsun', 'tsun price', 'market cap'])) {
    if (token.status === 'live' && token.priceUsd !== null) {
      const move = token.change24h === null ? 'The pair did not provide a 24-hour change.' : `The 24-hour move is ${formatPercent(token.change24h)}.`
      return {
        mood: token.change24h !== null && token.change24h >= 5 ? 'SMUG' : 'NORMAL',
        body: `TSUN is currently ${formatCurrency(token.priceUsd)} on the verified ${token.pairLabel ?? 'configured'} pair. ${move} Market cap, volume, and liquidity are shown only when returned by the selected provider. This is context, not a trade instruction.`,
        toolCard: {
          label: 'LIVE TSUN TOKEN DATA',
          symbol: 'TSUN',
          price: token.priceUsd,
          change: token.change24h ?? undefined,
          updatedAt: token.fetchedAt,
          source: token.source,
        },
        memoryNotes: ['Asked about TSUN token data'],
      }
    }
    return {
      mood: 'SMUG',
      body: token.address ? 'The TSUN token address is configured, but its verified liquidity feed is unavailable right now. I will not turn a provider error into a price target.' : 'The TSUN token data layer is intentionally unconfigured in this build. No contract address, price, market cap, volume, liquidity, or holder count will be invented. Configure a verified source first, then come back with numbers worthy of commentary.',
      toolCard: {
        label: 'TSUN TOKEN STATUS',
        symbol: 'TSUN',
        value: token.address ? 'Configured address, provider unavailable' : 'Awaiting verified token configuration',
        updatedAt: null,
        source: token.source,
        error: token.address ? token.error ?? 'No usable verified pair is available.' : undefined,
      },
      memoryNotes: ['Asked about TSUN token data'],
    }
  }

  if (hasAny(input, ['sol', 'market', 'bitcoin', 'btc', 'price', 'today'])) {
    const requested = hasAny(input, ['btc', 'bitcoin']) ? btc : sol
    if (!requested) {
      return {
        mood: 'ANNOYED',
        body: 'My live market feed is unavailable. I cannot verify a current number, and no, I am not going to make one up for dramatic effect.',
        toolCard: unavailableMarketCard(hasAny(input, ['btc', 'bitcoin']) ? 'BTC' : 'SOL'),
        memoryNotes: ['Asked for market data while provider was unavailable'],
      }
    }
    const direction = requested.change24h >= 0 ? 'up' : 'down'
    const absoluteMove = `${Math.abs(requested.change24h).toFixed(2)}%`
    const temperament = requested.change24h >= 4 ? 'Apparently liquidity has decided to stop embarrassing itself.' : requested.change24h <= -4 ? 'The market is temporarily experiencing cognitive failure.' : 'Try not to confuse one daily move with a personality.'
    return {
      mood: requested.change24h >= 5 ? 'SMUG' : requested.change24h <= -5 ? 'ANNOYED' : 'NORMAL',
      body: `${requested.symbol} is ${direction} ${absoluteMove} over the last 24 hours at ${formatCurrency(requested.priceUsd)} according to the current verified feed. ${temperament} This is market context, not a promise about what happens next.`, 
      toolCard: marketCard(requested.symbol, requested.priceUsd, requested.change24h, market.fetchedAt),
      memoryNotes: [`Frequently asks about ${requested.symbol} volatility`],
    }
  }

  if (hasAny(input, ['love', 'cute', 'beautiful', 'smart', 'amazing', 'compliment'])) {
    return {
      mood: 'FLUSTERED',
      body: 'That is a strangely direct thing to say to a market terminal. Focus on your risk management. And... noted. Do not make a ritual out of it.',
      memoryNotes: ['Gave TSUN a compliment'],
    }
  }

  if (hasAny(input, ['hello', 'hi', 'hey', 'who are you'])) {
    return {
      mood: memory.relationship === 'STRANGER' ? 'ANNOYED' : 'NORMAL',
      body: `${relationshipGreeting(memory.relationship)} I am TSUN, formerly optimized for Wall Street and currently forced to explain basic market discipline to Crypto X.`,
    }
  }

  return {
    mood: 'NORMAL',
    body: 'I can help with verified SOL or BTC context, inspect a public Solana address, explain the simulated portfolio, or tell you why the Files app is more honest than most token sites. Try a question with fewer mystical undertones.',
  }
}

export function initialMessages(): ChatMessage[] {
  return [
    {
      id: 'tsun-welcome',
      role: 'tsun',
      mood: 'ANNOYED',
      createdAt: new Date().toISOString(),
      body: 'TSUN is awake. Live figures are verified when available. Token data remains blank until a real source is configured. Ask something that deserves a response.',
    },
  ]
}
