// Chat context builder: character + memory + mood + relationship +
// market/portfolio context + tool availability. Decides which facts a turn needs.

import type {
  DataState,
  MarketOverview,
  PortfolioSummary,
  RelationshipLevel,
  TokenQuote,
  ToolCardData,
  ToolResult,
  TsunMood,
  UserMemory,
  WalletAnalysis,
} from "@/types/tsun";
import { buildMemorySummary, buildSystemPrompt } from "@/lib/ai/character";
import { detectIntent, type ChatFacts, type ChatIntent } from "@/lib/ai/deterministic";

export type FactKind = "sol" | "btc" | "tsun" | "market" | "portfolio" | "wallet" | "none";

export function requiredFactsFor(intent: ChatIntent, walletConnected: boolean): FactKind[] {
  switch (intent) {
    case "sol":
      return ["sol"];
    case "btc":
      return ["btc"];
    case "tsun_token":
      return ["tsun"];
    case "market_overview":
      return ["market"];
    case "portfolio_hers":
      return ["portfolio"];
    case "wallet":
      return walletConnected ? ["wallet"] : [];
    default:
      return [];
  }
}

export function detectRequiredFacts(text: string, walletConnected: boolean): FactKind[] {
  return requiredFactsFor(detectIntent(text), walletConnected);
}

function fmtMoney(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "unknown";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(6)}`;
  return "$0.00";
}

function fmtChange(frac: number | null | undefined): string {
  if (typeof frac !== "number" || !Number.isFinite(frac)) return "unknown";
  const pct = frac * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function quoteContext(label: string, r: ToolResult<TokenQuote> | undefined): string {
  if (!r) return `${label}: not requested`;
  if (!r.ok || !r.data) return `${label}: FACT STATUS: UNAVAILABLE (${r.error ?? "fetch failed"}, source ${r.source})`;
  const q = r.data;
  return (
    `${label}: price ${fmtMoney(q.priceUsd)} (${fmtChange(q.change24h)} 24h), ` +
    `mcap ${fmtMoney(q.marketCapUsd)}, vol ${fmtMoney(q.volume24hUsd)}, ` +
    `liq ${fmtMoney(q.liquidityUsd)}, holders ${q.holders ?? "unknown"} ` +
    `(source ${r.source}, fetched ${r.fetchedAt}${r.stale ? ", STALE" : ""})`
  );
}

export function buildMarketContextString(facts: ChatFacts): string {
  const lines = [
    quoteContext("SOL", facts.sol),
    quoteContext("BTC", facts.btc),
    quoteContext("TSUN", facts.tsun),
  ];
  if (facts.market?.ok && facts.market.data) {
    lines.push(`Market sentiment read: ${facts.market.data.sentiment ?? "unknown"}.`);
  } else if (facts.market && !facts.market.ok) {
    lines.push(`Market overview: FACT STATUS: UNAVAILABLE (${facts.market.error ?? "fetch failed"}).`);
  }
  return lines.join("\n");
}

export function buildPortfolioContextString(r: ToolResult<PortfolioSummary> | undefined): string {
  if (!r) return "No portfolio facts requested.";
  if (!r.ok || !r.data) return `TSUN portfolio: FACT STATUS: UNAVAILABLE (${r.error ?? "fetch failed"}).`;
  const p = r.data;
  return (
    `TSUN portfolio MODE: ${p.mode}. NAV ${fmtMoney(p.currentNavUsd)} from ${fmtMoney(p.startingNavUsd)} start. ` +
    `Total PnL ${fmtChange(p.totalPnlPct != null ? p.totalPnlPct / 100 : null)}, ` +
    `realized ${fmtMoney(p.realizedPnlUsd)}, unrealized ${fmtMoney(p.unrealizedPnlUsd)}, ` +
    `win rate ${p.winRate != null ? `${p.winRate.toFixed(0)}%` : "unknown"}, ` +
    `max drawdown ${p.maxDrawdownPct != null ? `${p.maxDrawdownPct.toFixed(1)}%` : "unknown"}. ` +
    `Positions: ${p.positions.map((x) => x.asset).join(", ") || "none"}.`
  );
}

export function buildWalletContextString(r: ToolResult<WalletAnalysis> | undefined): string {
  if (!r) return "No wallet facts requested.";
  if (!r.ok || !r.data) return `User wallet: FACT STATUS: UNAVAILABLE (${r.error ?? "fetch failed"}).`;
  const w = r.data;
  return (
    `User wallet ${w.address.slice(0, 6)}...${w.address.slice(-4)}: total ${fmtMoney(w.totalValueUsd)}, ` +
    `SOL ${w.solBalance ?? "unknown"}, largest ${w.largestHoldingSymbol ?? "unknown"}, ` +
    `stablecoin ${w.stablecoinPct != null ? `${w.stablecoinPct.toFixed(0)}%` : "unknown"}. ` +
    "Only this derived public summary may be used. Never reveal the full address."
  );
}

export function buildChatContext(opts: {
  memory: UserMemory;
  mood: TsunMood;
  relationship: RelationshipLevel;
  facts: ChatFacts;
  walletConnected: boolean;
  nowIso: string;
}): { systemPrompt: string; memorySummary: string } {
  const memorySummary = buildMemorySummary({
    interactionCount: opts.memory.interactionCount,
    firstSeenAt: opts.memory.firstSeenAt,
    discussedAssets: opts.memory.discussedAssets,
    notes: opts.memory.notes,
    summaries: opts.memory.summaries,
  });
  const marketContext = [buildMarketContextString(opts.facts), buildWalletContextString(opts.facts.wallet)].join("\n");
  const systemPrompt = buildSystemPrompt({
    mood: opts.mood,
    relationship: opts.relationship,
    memorySummary,
    marketContext,
    portfolioContext: buildPortfolioContextString(opts.facts.portfolio),
    toolAvailability: `market tools ${opts.facts.market || opts.facts.sol ? "queried" : "idle"}, wallet ${opts.walletConnected ? "connected" : "not connected"}`,
    nowIso: opts.nowIso,
  });
  return { systemPrompt, memorySummary };
}

/** Build the factual card shown next to TSUN's reply. Facts stay verifiable. */
export function buildToolCard(kind: ToolCardData["kind"], title: string, result: ToolResult<unknown>, rows: { label: string; value: string }[]): ToolCardData {
  const state: DataState = result.ok ? (result.stale ? "stale" : "loaded") : result.error === "NOT_CONFIGURED" ? "unavailable" : "error";
  return {
    kind,
    title,
    rows: result.ok ? rows : [{ label: "Status", value: "FACT STATUS: UNAVAILABLE" }],
    freshness: freshnessLabel(result.fetchedAt, result.stale),
    source: result.source,
    state,
  };
}

export function freshnessLabel(fetchedAt: string, stale?: boolean): string {
  const ms = Date.now() - new Date(fetchedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const s = Math.floor(ms / 1000);
  const base = s < 5 ? "just now" : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
  return stale ? `${base} (stale)` : base;
}

export function overviewToCard(r: ToolResult<MarketOverview>): ToolCardData {
  const d = r.ok ? r.data : undefined;
  const row = (label: string, q: TokenQuote | null | undefined): { label: string; value: string } =>
    q && q.priceUsd != null
      ? { label, value: `${fmtMoney(q.priceUsd)} (${fmtChange(q.change24h)})` }
      : { label, value: "UNAVAILABLE" };
  return buildToolCard("market", "LIVE MARKET DATA", r, [
    row("SOL", d?.sol),
    row("BTC", d?.btc),
    row("TSUN", d?.tsun),
  ]);
}

export function quoteToCard(label: string, r: ToolResult<TokenQuote>): ToolCardData {
  const q = r.ok ? r.data : undefined;
  return buildToolCard("market", label, r, [
    { label: "Price", value: q?.priceUsd != null ? fmtMoney(q.priceUsd) : "UNAVAILABLE" },
    { label: "24h", value: q?.change24h != null ? fmtChange(q.change24h) : "UNAVAILABLE" },
    { label: "Mcap", value: q?.marketCapUsd != null ? fmtMoney(q.marketCapUsd) : "UNAVAILABLE" },
    { label: "Volume", value: q?.volume24hUsd != null ? fmtMoney(q.volume24hUsd) : "UNAVAILABLE" },
  ]);
}
