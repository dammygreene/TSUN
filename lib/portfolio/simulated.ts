// TSUN public portfolio. MVP runs fully SIMULATED demo data, always labeled
// MODE: SIMULATED. No trade here is real, verified, or on chain. Every trade
// carries simulated: true and verified: false so the UI can never mislabel one.

import type { PortfolioSummary, ToolResult, TsunPosition, TsunTrade } from "@/types/tsun";

const STARTING_NAV_USD = 10_000;

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

/** Fixed demo trade blotter. Deliberately underwater, that is the joke. */
function demoTrades(): TsunTrade[] {
  const t = (id: string, side: "BUY" | "SELL", asset: string, quantity: number, price: number, h: number): TsunTrade => ({
    id,
    side,
    asset,
    quantity,
    price,
    valueUsd: Math.round(quantity * price * 100) / 100,
    timestamp: hoursAgo(h),
    verified: false,
    simulated: true,
  });
  return [
    t("sim-001", "BUY", "SOL", 12, 198.4, 240),
    t("sim-002", "BUY", "JUP", 900, 0.92, 200),
    t("sim-003", "SELL", "SOL", 4, 211.2, 170),
    t("sim-004", "BUY", "TSUN", 250000, 0.0042, 150),
    t("sim-005", "SELL", "JUP", 900, 0.71, 120),
    t("sim-006", "BUY", "SOL", 6, 224.9, 96),
    t("sim-007", "SELL", "TSUN", 100000, 0.0029, 60),
    t("sim-008", "BUY", "WIF", 400, 1.84, 40),
    t("sim-009", "SELL", "WIF", 400, 1.31, 20),
    t("sim-010", "BUY", "SOL", 3, 186.2, 6),
  ];
}

function demoPositions(): TsunPosition[] {
  const p = (
    asset: string,
    quantity: number,
    avgEntry: number,
    currentPrice: number | null,
  ): TsunPosition => {
    const valueUsd = currentPrice != null ? Math.round(quantity * currentPrice * 100) / 100 : null;
    const cost = quantity * avgEntry;
    const unreal = valueUsd != null ? Math.round((valueUsd - cost) * 100) / 100 : null;
    return {
      asset,
      quantity,
      avgEntry,
      currentPrice,
      valueUsd,
      unrealizedPnlUsd: unreal,
      unrealizedPnlPct: unreal != null && cost > 0 ? Math.round((unreal / cost) * 10000) / 100 : null,
    };
  };
  // Demo marks. These are fictional SIMULATED marks, not live prices.
  // Sized so the book reconciles: NAV = start + realized + unrealized.
  return [
    p("SOL", 17, 203.1, 178.4),
    p("TSUN", 150000, 0.0042, 0.0026),
    p("USDC", 5431, 1, 1),
  ];
}

// Closed trade P&L implied by the blotter above (JUP -189, WIF -212,
// partial SOL +51, partial TSUN -130, plus fees). Kept as a constant so the
// blotter and the headline stay in sync by construction in tests.
const REALIZED_PNL_USD = -486.4;

export function buildSimulatedPortfolio(nowIso?: string): PortfolioSummary {
  const positions = demoPositions();
  const trades = demoTrades();
  const unrealizedPnlUsd = Math.round(positions.reduce((sum, x) => sum + (x.unrealizedPnlUsd ?? 0), 0) * 100) / 100;
  const totalPnlUsd = Math.round((REALIZED_PNL_USD + unrealizedPnlUsd) * 100) / 100;
  const currentNavUsd = Math.round((STARTING_NAV_USD + totalPnlUsd) * 100) / 100;
  return {
    mode: "SIMULATED",
    startingNavUsd: STARTING_NAV_USD,
    currentNavUsd,
    realizedPnlUsd: REALIZED_PNL_USD,
    unrealizedPnlUsd,
    totalPnlUsd,
    totalPnlPct: Math.round((totalPnlUsd / STARTING_NAV_USD) * 10000) / 100,
    winRate: 40,
    // Peak pain was worse than today. Drawdown always exceeds current loss.
    maxDrawdownPct: 22.4,
    bestTradeId: "sim-003",
    worstTradeId: "sim-009",
    positions,
    trades,
    updatedAt: nowIso ?? new Date().toISOString(),
  };
}

export async function getTSUNPortfolio(): Promise<ToolResult<PortfolioSummary>> {
  const now = new Date().toISOString();
  return { ok: true, data: buildSimulatedPortfolio(now), fetchedAt: now, source: "SIMULATED" };
}

export async function getTSUNTrades(): Promise<ToolResult<TsunTrade[]>> {
  const now = new Date().toISOString();
  return { ok: true, data: demoTrades(), fetchedAt: now, source: "SIMULATED" };
}
