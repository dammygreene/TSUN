// TSUN PORTFOLIO. Her public demo book, MODE: SIMULATED. Never mixed
// with the user wallet. Nothing here is a real trade.
"use client";

import { useEffect, useState } from "react";
import { ErrorBlock, LoadingLine, SectionLabel } from "@/components/os/ui";
import { DataFreshness, fmtPct, fmtUsd, PortfolioMetric, TradeRow, TransactionLink } from "@/components/terminal/primitives";
import { useTsunStore } from "@/lib/state/store";
import type { PortfolioSummary, ToolResult } from "@/types/tsun";

export default function PortfolioApp() {
  const [result, setResult] = useState<ToolResult<PortfolioSummary> | null>(null);
  const markPortfolioViewed = useTsunStore((s) => s.markPortfolioViewed);
  const pushNotice = useTsunStore((s) => s.pushNotice);

  useEffect(() => {
    markPortfolioViewed();
    pushNotice({ title: "PORTFOLIO OPENED", body: "Stop staring at my PnL.", kind: "character" });
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/portfolio", { cache: "no-store" });
        const body = (await res.json()) as ToolResult<PortfolioSummary>;
        if (!cancelled) setResult(body);
      } catch {
        if (!cancelled) setResult({ ok: false, error: "FETCH_FAILED", fetchedAt: new Date().toISOString(), source: "SIMULATED" });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openWallet = () => {
    useTsunStore.getState().openApp("wallet");
    useTsunStore.getState().setActiveMobileApp("wallet");
  };

  if (!result) return <div className="p-3"><LoadingLine label="LOADING PORTFOLIO..." /></div>;
  if (!result.ok || !result.data) {
    return (
      <div className="p-3">
        <ErrorBlock title="PORTFOLIO UNAVAILABLE" tsun="Even my fake ledger is unreachable. Enjoy the mystery." retry={() => window.location.reload()} />
      </div>
    );
  }
  const p = result.data;
  const tone = (p.totalPnlPct ?? 0) >= 0 ? "up" : "down";

  return (
    <div className="space-y-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-tsun-accent/40 bg-tsun-panel p-3">
        <div>
          <span className="rounded bg-tsun-accent px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.12em] text-black">
            MODE: {p.mode}
          </span>
          <p className="mt-1.5 text-xs text-tsun-muted">
            TSUN's public demo book. Simulated trades for the storyline, not real positions. Your wallet lives separately in{" "}
            <button onClick={openWallet} className="underline underline-offset-2 hover:text-tsun-text">My Money</button>.
          </p>
        </div>
        <DataFreshness fetchedAt={result.fetchedAt} source={result.source} state="loaded" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <PortfolioMetric label="Current NAV" value={fmtUsd(p.currentNavUsd)} />
        <PortfolioMetric label="Total PnL" value={`${fmtUsd(p.totalPnlUsd)} (${fmtPct(p.totalPnlPct != null ? p.totalPnlPct / 100 : null)})`} tone={tone} />
        <PortfolioMetric label="Realized" value={fmtUsd(p.realizedPnlUsd)} tone={p.realizedPnlUsd >= 0 ? "up" : "down"} />
        <PortfolioMetric label="Unrealized" value={fmtUsd(p.unrealizedPnlUsd)} tone={(p.unrealizedPnlUsd ?? 0) >= 0 ? "up" : "down"} />
        <PortfolioMetric label="Win rate" value={p.winRate != null ? `${p.winRate}%` : "--"} />
        <PortfolioMetric label="Max drawdown" value={p.maxDrawdownPct != null ? `${p.maxDrawdownPct}%` : "--"} tone="down" />
        <PortfolioMetric label="Start NAV" value={fmtUsd(p.startingNavUsd)} />
        <PortfolioMetric label="Positions" value={String(p.positions.length)} />
      </div>

      <div>
        <div className="mb-1.5"><SectionLabel>Open positions</SectionLabel></div>
        <div className="overflow-x-auto rounded-lg border border-tsun-border">
          <table className="w-full min-w-[480px] border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-tsun-border text-left text-tsun-muted">
                <th className="px-3 py-2 font-normal">ASSET</th>
                <th className="px-3 py-2 text-right font-normal">QTY</th>
                <th className="px-3 py-2 text-right font-normal">ENTRY</th>
                <th className="px-3 py-2 text-right font-normal">MARK</th>
                <th className="px-3 py-2 text-right font-normal">uPnL</th>
              </tr>
            </thead>
            <tbody>
              {p.positions.map((x) => (
                <tr key={x.asset} className="border-b border-tsun-border/60 last:border-0">
                  <td className="px-3 py-2 text-tsun-text">{x.asset}</td>
                  <td className="px-3 py-2 text-right text-tsun-muted">{x.quantity.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-tsun-muted">{fmtUsd(x.avgEntry)}</td>
                  <td className="px-3 py-2 text-right text-tsun-text">{fmtUsd(x.currentPrice)}</td>
                  <td className={`px-3 py-2 text-right ${(x.unrealizedPnlUsd ?? 0) >= 0 ? "text-profit" : "text-loss"}`}>
                    {fmtUsd(x.unrealizedPnlUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-1.5"><SectionLabel>Trade blotter</SectionLabel></div>
        <div className="rounded-lg border border-tsun-border bg-tsun-panel">
          {[...p.trades].reverse().map((t) => (
            <div key={t.id}>
              <TradeRow trade={t} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-tsun-dim">
          <span>Best: {p.bestTradeId ?? "--"} · Worst: {p.worstTradeId ?? "--"}</span>
          <TransactionLink signature={undefined} verified={false} />
        </div>
      </div>

      <p className="rounded-lg border border-tsun-border bg-tsun-panel p-3 text-sm text-tsun-text">
        <span className="font-mono text-xs text-tsun-muted">TSUN: </span>
        {(p.totalPnlPct ?? 0) >= 0
          ? "Genius takes many forms. Mine takes profit."
          : "The losses are strategic. The strategy is classified. Stop staring at them."}
      </p>
    </div>
  );
}
