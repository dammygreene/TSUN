import { describe, expect, it } from "vitest";
import { buildSimulatedPortfolio } from "@/lib/portfolio/simulated";

describe("simulated portfolio", () => {
  it("reconciles: NAV equals start plus total PnL", () => {
    const p = buildSimulatedPortfolio("2026-01-01T00:00:00.000Z");
    expect(p.mode).toBe("SIMULATED");
    expect(p.currentNavUsd).toBeCloseTo(p.startingNavUsd + (p.totalPnlUsd ?? 0), 6);
    expect(p.totalPnlUsd).toBeCloseTo(p.realizedPnlUsd + (p.unrealizedPnlUsd ?? 0), 6);
  });

  it("keeps unrealized in sync with positions", () => {
    const p = buildSimulatedPortfolio();
    const sum = p.positions.reduce((s, x) => s + (x.unrealizedPnlUsd ?? 0), 0);
    expect(p.unrealizedPnlUsd).toBeCloseTo(sum, 6);
  });

  it("keeps max drawdown above the current loss", () => {
    const p = buildSimulatedPortfolio();
    expect(p.maxDrawdownPct ?? 0).toBeGreaterThanOrEqual(Math.abs(p.totalPnlPct ?? 0));
  });

  it("marks every trade simulated and unverified", () => {
    const p = buildSimulatedPortfolio();
    expect(p.trades.length).toBeGreaterThan(0);
    for (const t of p.trades) {
      expect(t.simulated).toBe(true);
      expect(t.verified).toBe(false);
      expect(t.txSignature).toBeUndefined();
    }
  });
});
