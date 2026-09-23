import type { TokenState } from '../types'

const DEX_SCREENER_BASE = 'https://api.dexscreener.com/latest/dex/tokens'

export const tokenConfiguration = {
  address: (import.meta.env.VITE_TSUN_TOKEN_ADDRESS ?? '').trim() || null,
  preferredPair: (import.meta.env.VITE_TSUN_PAIR_ADDRESS ?? '').trim() || null,
}

type DexPair = {
  chainId?: string
  pairAddress?: string
  url?: string
  baseToken?: { symbol?: string }
  quoteToken?: { symbol?: string }
  priceUsd?: string
  priceNative?: string
  priceChange?: { h24?: number }
  marketCap?: number
  fdv?: number
  volume?: { h24?: number }
  liquidity?: { usd?: number }
}

type DexResponse = { pairs?: DexPair[] }

function numberOrNull(value: unknown) {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(number) ? number : null
}

function selectPair(pairs: DexPair[], preferredPair: string | null) {
  const solanaPairs = pairs.filter((pair) => pair.chainId === 'solana')
  if (preferredPair) {
    const exact = solanaPairs.find((pair) => pair.pairAddress === preferredPair)
    if (exact) return exact
  }
  return solanaPairs
    .slice()
    .sort((a, b) => (numberOrNull(b.liquidity?.usd) ?? 0) - (numberOrNull(a.liquidity?.usd) ?? 0))[0]
}

export function initialTokenState(): TokenState {
  return {
    address: tokenConfiguration.address,
    status: tokenConfiguration.address ? 'loading' : 'unavailable',
    source: 'DexScreener',
    fetchedAt: null,
    error: tokenConfiguration.address ? null : 'No VITE_TSUN_TOKEN_ADDRESS is configured.',
    pairLabel: null,
    dexUrl: null,
    priceUsd: null,
    priceNative: null,
    change24h: null,
    marketCap: null,
    volume24h: null,
    liquidityUsd: null,
  }
}

export async function fetchTokenState(): Promise<TokenState> {
  const initial = initialTokenState()
  if (!initial.address) return initial

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 9000)
  try {
    const response = await fetch(`${DEX_SCREENER_BASE}/${encodeURIComponent(initial.address)}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`DexScreener returned ${response.status}`)
    const payload = (await response.json()) as DexResponse
    const pair = selectPair(payload.pairs ?? [], tokenConfiguration.preferredPair)
    if (!pair) throw new Error('No Solana liquidity pair was found for the configured token address.')

    const priceUsd = numberOrNull(pair.priceUsd)
    if (priceUsd === null) throw new Error('The selected pair did not include a usable USD price.')

    return {
      address: initial.address,
      status: 'live',
      source: 'DexScreener',
      fetchedAt: new Date().toISOString(),
      error: null,
      pairLabel: `${pair.baseToken?.symbol ?? 'TSUN'} / ${pair.quoteToken?.symbol ?? 'SOL'}`,
      dexUrl: pair.url ?? null,
      priceUsd,
      priceNative: numberOrNull(pair.priceNative),
      change24h: numberOrNull(pair.priceChange?.h24),
      marketCap: numberOrNull(pair.marketCap) ?? numberOrNull(pair.fdv),
      volume24h: numberOrNull(pair.volume?.h24),
      liquidityUsd: numberOrNull(pair.liquidity?.usd),
    }
  } catch (error) {
    return {
      ...initial,
      status: 'unavailable',
      error: error instanceof Error ? error.message : 'Token provider unavailable',
    }
  } finally {
    window.clearTimeout(timer)
  }
}
