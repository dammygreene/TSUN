import type { MarketAsset, MarketState } from '../types'

const COINGECKO_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true'
const COINGECKO_CHART_URL =
  'https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=30&interval=hourly'

async function fetchJson<T>(url: string, timeout = 9000): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`Provider returned ${response.status}`)
    return (await response.json()) as T
  } finally {
    window.clearTimeout(timer)
  }
}

type PriceResponse = Record<
  'solana' | 'bitcoin',
  { usd?: number; usd_24h_change?: number; last_updated_at?: number }
>

type ChartResponse = { prices?: Array<[number, number]> }

function assetFrom(id: 'solana' | 'bitcoin', symbol: 'SOL' | 'BTC', name: string, raw?: PriceResponse['solana']): MarketAsset | undefined {
  if (!raw || typeof raw.usd !== 'number' || typeof raw.usd_24h_change !== 'number') return undefined
  return {
    id,
    symbol,
    name,
    priceUsd: raw.usd,
    change24h: raw.usd_24h_change,
  }
}

export async function fetchMarketState(): Promise<Pick<MarketState, 'assets' | 'fetchedAt' | 'status' | 'source' | 'error'>> {
  try {
    const raw = await fetchJson<PriceResponse>(COINGECKO_PRICE_URL)
    const assets = {
      solana: assetFrom('solana', 'SOL', 'Solana', raw.solana),
      bitcoin: assetFrom('bitcoin', 'BTC', 'Bitcoin', raw.bitcoin),
    }
    if (!assets.solana && !assets.bitcoin) throw new Error('Provider response did not include usable market prices')
    return {
      assets,
      fetchedAt: new Date().toISOString(),
      status: 'live',
      source: 'CoinGecko',
      error: null,
    }
  } catch (error) {
    return {
      assets: {},
      fetchedAt: null,
      status: 'unavailable',
      source: 'CoinGecko',
      error: error instanceof Error ? error.message : 'Market provider unavailable',
    }
  }
}

export async function fetchSolChart(): Promise<Pick<MarketState, 'chartPrices' | 'chartFetchedAt'>> {
  try {
    const raw = await fetchJson<ChartResponse>(COINGECKO_CHART_URL)
    const prices = (raw.prices ?? []).filter(
      (point): point is [number, number] => Array.isArray(point) && typeof point[0] === 'number' && typeof point[1] === 'number',
    )
    return { chartPrices: prices, chartFetchedAt: prices.length ? new Date().toISOString() : null }
  } catch {
    return { chartPrices: [], chartFetchedAt: null }
  }
}

export function filterChartRange(points: Array<[number, number]>, range: '1H' | '4H' | '1D' | '1W' | 'ALL') {
  if (!points.length || range === 'ALL') return points
  const duration: Record<Exclude<typeof range, 'ALL'>, number> = {
    '1H': 60 * 60 * 1000,
    '4H': 4 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000,
    '1W': 7 * 24 * 60 * 60 * 1000,
  }
  const cutoff = points[points.length - 1][0] - duration[range]
  const selection = points.filter(([timestamp]) => timestamp >= cutoff)
  return selection.length >= 2 ? selection : points.slice(-Math.max(2, Math.min(24, points.length)))
}
