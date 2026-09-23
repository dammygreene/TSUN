// Server side market providers. Every function returns a ToolResult and
// never throws to callers. On failure, serve stale cache honestly or report
// UNAVAILABLE. No fabricated numbers anywhere in this file.

import { appConfig, isTokenConfigured, serverConfig, tokenConfig } from "@/lib/config";
import type { Candle, DataState, MarketMover, MarketOverview, TokenQuote, ToolResult } from "@/types/tsun";

const FETCH_TIMEOUT_MS = 6_000;

interface CacheEntry {
  at: number;
  result: ToolResult<never>;
}

const cache = new Map<string, CacheEntry>();

/** Test hook: clear the in memory cache between tests. */
export function __clearMarketCache(): void {
  cache.clear();
}

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<{ status: number; json: unknown }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal, cache: "no-store" });
    const json: unknown = await res.json().catch(() => null);
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

function fail<T>(source: string, error: string, lastSuccessAt?: string): ToolResult<T> {
  return { ok: false, error, fetchedAt: new Date().toISOString(), source, lastSuccessAt };
}

function classifyFetchError(status: number, err: unknown): string {
  if (err instanceof Error && err.name === "AbortError") return "TIMEOUT";
  if (status === 429) return "RATE_LIMITED";
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status >= 500) return "PROVIDER_ERROR";
  return "FETCH_FAILED";
}

async function cached<T>(key: string, source: string, fetcher: () => Promise<ToolResult<T>>): Promise<ToolResult<T>> {
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now - hit.at < appConfig.marketFreshMs && hit.result.ok) {
    return { ...(hit.result as ToolResult<T>), stale: false };
  }
  let result: ToolResult<T>;
  try {
    result = await fetcher();
  } catch (err) {
    result = fail<T>(source, err instanceof Error ? err.message : "FETCH_FAILED", (hit?.result as ToolResult<T> | undefined)?.lastSuccessAt);
  }
  if (result.ok) {
    const entry: CacheEntry = { at: now, result: result as ToolResult<never> };
    cache.set(key, entry);
    return { ...result, lastSuccessAt: result.fetchedAt };
  }
  // Serve stale cache honestly when the provider fails.
  if (hit?.result.ok) {
    const prev = hit.result as unknown as ToolResult<T>;
    return { ...prev, stale: true, fetchedAt: new Date().toISOString(), lastSuccessAt: prev.fetchedAt };
  }
  return result;
}

interface GeckoPriceEntry {
  usd?: number;
  usd_24h_change?: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
}

async function fetchGecko(ids: string[]): Promise<ToolResult<Record<string, GeckoPriceEntry>>> {
  const source = "CoinGecko";
  const url =
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}` +
    "&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&precision=full";
  const headers: Record<string, string> = { accept: "application/json" };
  if (serverConfig.coingeckoApiKey) headers["x-cg-demo-api-key"] = serverConfig.coingeckoApiKey;
  try {
    const { status, json } = await fetchJson(url, headers);
    if (status !== 200 || !json || typeof json !== "object") {
      return fail(source, classifyFetchError(status, null));
    }
    return { ok: true, data: json as Record<string, GeckoPriceEntry>, fetchedAt: new Date().toISOString(), source };
  } catch (err) {
    return fail(source, classifyFetchError(0, err));
  }
}

function geckoQuote(symbol: string, name: string, e: GeckoPriceEntry | undefined): TokenQuote {
  return {
    symbol,
    name,
    priceUsd: typeof e?.usd === "number" ? e.usd : null,
    change24h: typeof e?.usd_24h_change === "number" ? e.usd_24h_change / 100 : null,
    marketCapUsd: typeof e?.usd_market_cap === "number" ? e.usd_market_cap : null,
    volume24hUsd: typeof e?.usd_24h_vol === "number" ? e.usd_24h_vol : null,
    liquidityUsd: null,
    holders: null,
  };
}

export async function getSOLPrice(): Promise<ToolResult<TokenQuote>> {
  return cached<TokenQuote>("sol", "CoinGecko", async () => {
    const r = await fetchGecko(["solana"]);
    if (!r.ok || !r.data?.solana) return fail("CoinGecko", r.error ?? "MALFORMED_RESPONSE");
    return { ok: true, data: geckoQuote("SOL", "Solana", r.data.solana), fetchedAt: r.fetchedAt, source: r.source };
  });
}

export async function getBTCPrice(): Promise<ToolResult<TokenQuote>> {
  return cached<TokenQuote>("btc", "CoinGecko", async () => {
    const r = await fetchGecko(["bitcoin"]);
    if (!r.ok || !r.data?.bitcoin) return fail("CoinGecko", r.error ?? "MALFORMED_RESPONSE");
    return { ok: true, data: geckoQuote("BTC", "Bitcoin", r.data.bitcoin), fetchedAt: r.fetchedAt, source: r.source };
  });
}

interface DexPair {
  chainId?: string;
  dexId?: string;
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  marketCap?: number;
  fdv?: number;
  pairAddress?: string;
  baseToken?: { symbol?: string; name?: string };
  quoteToken?: { symbol?: string };
}

async function fetchTsunPairs(): Promise<ToolResult<{ pairs: DexPair[]; fetchedAt: string }>> {
  const source = "DexScreener";
  if (!isTokenConfigured()) return fail(source, "NOT_CONFIGURED");
  const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenConfig.mint}`;
  try {
    const { status, json } = await fetchJson(url);
    if (status !== 200 || !json || typeof json !== "object" || !Array.isArray((json as { pairs?: unknown }).pairs)) {
      return fail(source, classifyFetchError(status, null));
    }
    return { ok: true, data: { pairs: (json as { pairs: DexPair[] }).pairs, fetchedAt: new Date().toISOString() }, fetchedAt: new Date().toISOString(), source };
  } catch (err) {
    return fail(source, classifyFetchError(0, err));
  }
}

function pickPrimaryPair(pairs: DexPair[]): DexPair | null {
  const solana = pairs.filter((p) => p.chainId === "solana");
  const pool = solana.length > 0 ? solana : pairs;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
}

function dexQuote(pair: DexPair | null): TokenQuote {
  const price = pair?.priceUsd ? Number(pair.priceUsd) : NaN;
  return {
    symbol: "TSUN",
    name: pair?.baseToken?.name ?? "TSUN",
    priceUsd: Number.isFinite(price) ? price : null,
    change24h: typeof pair?.priceChange?.h24 === "number" ? pair.priceChange.h24 / 100 : null,
    marketCapUsd: pair?.marketCap ?? pair?.fdv ?? null,
    volume24hUsd: pair?.volume?.h24 ?? null,
    liquidityUsd: pair?.liquidity?.usd ?? null,
    holders: null,
    pair: pair && pair.baseToken?.symbol && pair.quoteToken?.symbol ? `${pair.baseToken.symbol}/${pair.quoteToken.symbol}` : tokenConfig.pair,
  };
}

export async function getTokenPrice(): Promise<ToolResult<TokenQuote>> {
  return cached<TokenQuote>("tsun", "DexScreener", async () => {
    const r = await fetchTsunPairs();
    if (!r.ok || !r.data) return fail("DexScreener", r.error ?? "MALFORMED_RESPONSE");
    return { ok: true, data: dexQuote(pickPrimaryPair(r.data.pairs)), fetchedAt: r.fetchedAt, source: r.source };
  });
}

export async function getTokenMarketCap(): Promise<ToolResult<number | null>> {
  const r = await getTokenPrice();
  if (!r.ok) return { ...r, data: undefined } as ToolResult<number | null>;
  return { ...r, data: r.data?.marketCapUsd ?? null };
}

export async function getTokenVolume(): Promise<ToolResult<number | null>> {
  const r = await getTokenPrice();
  if (!r.ok) return { ...r, data: undefined } as ToolResult<number | null>;
  return { ...r, data: r.data?.volume24hUsd ?? null };
}

export async function getTokenLiquidity(): Promise<ToolResult<number | null>> {
  const r = await getTokenPrice();
  if (!r.ok) return { ...r, data: undefined } as ToolResult<number | null>;
  return { ...r, data: r.data?.liquidityUsd ?? null };
}

export async function getTokenHolders(): Promise<ToolResult<number | null>> {
  // No holder provider is configured in the MVP. Report honestly.
  if (!isTokenConfigured()) return fail("none", "NOT_CONFIGURED");
  return fail("none", "HOLDERS_UNAVAILABLE");
}

export async function getMarketOverview(): Promise<ToolResult<MarketOverview>> {
  return cached<MarketOverview>("overview", "CoinGecko+DexScreener", async () => {
    const [sol, btc, tsun] = await Promise.all([getSOLPrice(), getBTCPrice(), getTokenPrice()]);
    const movers: MarketMover[] = [];
    if (sol.ok && sol.data) movers.push({ symbol: "SOL", priceUsd: sol.data.priceUsd, change24h: sol.data.change24h });
    if (btc.ok && btc.data) movers.push({ symbol: "BTC", priceUsd: btc.data.priceUsd, change24h: btc.data.change24h });
    if (tsun.ok && tsun.data && tsun.data.priceUsd != null) {
      movers.push({ symbol: "TSUN", priceUsd: tsun.data.priceUsd, change24h: tsun.data.change24h });
    }
    movers.sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0));
    if (movers.length === 0) return fail("CoinGecko+DexScreener", "ALL_PROVIDERS_FAILED");
    const refs = [sol.ok ? sol.data?.change24h : null, btc.ok ? btc.data?.change24h : null].filter(
      (v): v is number => typeof v === "number",
    );
    const avg = refs.length > 0 ? refs.reduce((a, b) => a + b, 0) / refs.length : null;
    const sentiment = avg == null ? null : avg > 0.03 ? "RISK ON" : avg < -0.03 ? "RISK OFF" : "CHOP";
    const data: MarketOverview = {
      sol: sol.ok ? (sol.data ?? null) : null,
      btc: btc.ok ? (btc.data ?? null) : null,
      tsun: tsun.ok ? (tsun.data ?? null) : null,
      movers,
      sentiment,
    };
    return { ok: true, data, fetchedAt: new Date().toISOString(), source: "CoinGecko+DexScreener" };
  });
}

export async function getTrendingTokens(): Promise<ToolResult<MarketMover[]>> {
  const r = await getMarketOverview();
  if (!r.ok || !r.data) return fail("CoinGecko+DexScreener", r.error ?? "FETCH_FAILED");
  return { ...r, data: r.data.movers };
}

export type CandleRange = "1H" | "4H" | "1D" | "1W" | "ALL";

const RANGE_PARAMS: Record<CandleRange, { timeframe: string; aggregate: number; limit: number }> = {
  "1H": { timeframe: "minute", aggregate: 1, limit: 60 },
  "4H": { timeframe: "minute", aggregate: 5, limit: 48 },
  "1D": { timeframe: "hour", aggregate: 1, limit: 24 },
  "1W": { timeframe: "hour", aggregate: 4, limit: 42 },
  ALL: { timeframe: "day", aggregate: 1, limit: 180 },
};

interface GeckoOhlcv {
  data?: {
    attributes?: {
      ohlcv_list?: [number, string, string, string, string, string][];
    };
  };
}

export async function getCandles(range: CandleRange): Promise<ToolResult<Candle[]>> {
  return cached<Candle[]>(`candles-${range}`, "GeckoTerminal", async () => {
    const source = "GeckoTerminal";
    if (!isTokenConfigured()) return fail(source, "NOT_CONFIGURED");
    const pairs = await fetchTsunPairs();
    if (!pairs.ok || !pairs.data) return fail(source, pairs.error ?? "PAIR_UNKNOWN");
    const primary = pickPrimaryPair(pairs.data.pairs);
    if (!primary?.pairAddress) return fail(source, "PAIR_UNKNOWN");
    const p = RANGE_PARAMS[range];
    const url =
      `https://api.geckoterminal.com/api/v2/networks/solana/pools/${primary.pairAddress}` +
      `/ohlcv/${p.timeframe}?aggregate=${p.aggregate}&limit=${p.limit}&currency=usd`;
    try {
      const { status, json } = await fetchJson(url, { accept: "application/json" });
      const list = (json as GeckoOhlcv)?.data?.attributes?.ohlcv_list;
      if (status !== 200 || !Array.isArray(list)) return fail(source, classifyFetchError(status, null));
      const candles: Candle[] = [];
      for (const row of list) {
        const [t, o, h, l, c] = row;
        const vals = [o, h, l, c].map(Number);
        if (!Number.isFinite(t) || vals.some((v) => !Number.isFinite(v))) continue;
        candles.push({ time: t, open: vals[0], high: vals[1], low: vals[2], close: vals[3] });
      }
      candles.sort((a, b) => a.time - b.time);
      if (candles.length === 0) return fail(source, "MALFORMED_RESPONSE");
      return { ok: true, data: candles, fetchedAt: new Date().toISOString(), source };
    } catch (err) {
      return fail(source, classifyFetchError(0, err));
    }
  });
}

/** Map a ToolResult to the five UI data states. */
export function toDataState<T>(r: ToolResult<T> | null | undefined): DataState {
  if (!r) return "loading";
  if (r.ok) return r.stale ? "stale" : "loaded";
  if (r.data !== undefined) return "stale";
  if (r.error === "NOT_CONFIGURED" || r.error === "HOLDERS_UNAVAILABLE") return "unavailable";
  return "error";
}
