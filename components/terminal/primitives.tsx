// Reusable financial components. Every data component supports the five
// data states and always shows freshness. No invented numbers.
"use client";

import { useEffect, useRef, useState } from "react";
import { DataBadge, LoadingLine } from "@/components/os/ui";
import { explorerTxUrl } from "@/lib/solana/connection";
import { cn } from "@/lib/utils";
import type { AgentEvent, Candle, DataState, TokenQuote, TsunMood, TsunTrade } from "@/types/tsun";

export function fmtUsd(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "UNAVAILABLE";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(6)}`;
  return "$0.00";
}

export function fmtPct(frac: number | null | undefined): string {
  if (typeof frac !== "number" || !Number.isFinite(frac)) return "--";
  const pct = frac * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

export function MovementBadge({ change }: { change: number | null | undefined }) {
  if (typeof change !== "number" || !Number.isFinite(change)) {
    return <span className="font-mono text-xs text-tsun-dim">--</span>;
  }
  return (
    <span className={cn("font-mono text-xs", change >= 0 ? "text-profit" : "text-loss")}>
      {fmtPct(change)}
    </span>
  );
}

export function MetricBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-tsun-border bg-tsun-panel px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-tsun-muted">{label}</div>
      <div className="mt-0.5 font-mono text-base text-tsun-text">{value}</div>
      {sub && <div className="font-mono text-[11px] text-tsun-dim">{sub}</div>}
    </div>
  );
}

export function PortfolioMetric({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "flat" }) {
  return (
    <div className="rounded-md border border-tsun-border bg-tsun-panel px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-tsun-muted">{label}</div>
      <div className={cn("mt-0.5 font-mono text-base", tone === "up" ? "text-profit" : tone === "down" ? "text-loss" : "text-tsun-text")}>
        {value}
      </div>
    </div>
  );
}

export function DataFreshness({ fetchedAt, source, state }: { fetchedAt: string | null; source: string; state: DataState }) {
  const [age, setAge] = useState("--");
  useEffect(() => {
    if (!fetchedAt) {
      setAge("never");
      return;
    }
    const update = () => {
      const s = Math.max(0, Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000));
      setAge(s < 5 ? "just now" : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`);
    };
    update();
    const t = setInterval(update, 5000);
    return () => clearInterval(t);
  }, [fetchedAt]);
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] text-tsun-dim">
      <DataBadge state={state} />
      <span>
        {source} · {age}
      </span>
    </div>
  );
}

export function MarketTicker({ items }: { items: { symbol: string; price: string; change: number | null }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto border-t border-tsun-border bg-tsun-ink px-3 py-2" aria-label="Market ticker">
      {items.map((it) => (
        <span key={it.symbol} className="flex shrink-0 items-center gap-2 font-mono text-xs">
          <span className="text-tsun-muted">{it.symbol}</span>
          <span className="text-tsun-text">{it.price}</span>
          <MovementBadge change={it.change} />
        </span>
      ))}
    </div>
  );
}

export function MarketTable({ rows, onSelect }: { rows: TokenQuote[]; onSelect?: (symbol: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-tsun-border" role="table" aria-label="Market board">
      <table className="w-full min-w-[560px] border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-tsun-border text-left text-tsun-muted">
            <th className="px-3 py-2 font-normal">ASSET</th>
            <th className="px-3 py-2 text-right font-normal">PRICE</th>
            <th className="px-3 py-2 text-right font-normal">24H</th>
            <th className="px-3 py-2 text-right font-normal">MCAP</th>
            <th className="px-3 py-2 text-right font-normal">VOL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr
              key={q.symbol}
              onClick={() => onSelect?.(q.symbol)}
              className={cn("border-b border-tsun-border/60 last:border-0", onSelect && "cursor-pointer hover:bg-tsun-panel")}
            >
              <td className="px-3 py-2.5 text-tsun-text">
                {q.symbol}
                <span className="ml-2 text-tsun-dim">{q.name}</span>
              </td>
              <td className="px-3 py-2.5 text-right text-tsun-text">{fmtUsd(q.priceUsd)}</td>
              <td className="px-3 py-2.5 text-right"><MovementBadge change={q.change24h} /></td>
              <td className="px-3 py-2.5 text-right text-tsun-muted">{fmtUsd(q.marketCapUsd)}</td>
              <td className="px-3 py-2.5 text-right text-tsun-muted">{fmtUsd(q.volume24hUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PriceChart({ candles, state, note }: { candles: Candle[] | null; state: DataState; note?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!candles || candles.length === 0 || !ref.current) return;
    interface ChartHandle {
      remove: () => void;
      applyOptions: (o: unknown) => void;
      timeScale: () => { fitContent: () => void };
      addSeries: (t: unknown, o: unknown) => { setData: (d: unknown) => void };
    }
    let chart: ChartHandle | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const mod = await import("lightweight-charts");
        if (cancelled || !ref.current) return;
        const created = mod.createChart(ref.current, {
          height: 260,
          layout: { background: { type: mod.ColorType.Solid, color: "transparent" }, textColor: "#8A8A86", fontFamily: "monospace", fontSize: 11 },
          grid: { vertLines: { color: "#1B1B1B" }, horzLines: { color: "#1B1B1B" } },
          rightPriceScale: { borderColor: "#282828" },
          timeScale: { borderColor: "#282828" },
        }) as unknown as ChartHandle;
        chart = created;
        const series = created.addSeries(mod.LineSeries, {
          color: "#F1F1ED",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
        });
        series.setData(candles.map((c) => ({ time: c.time as unknown as never, value: c.close })));
        created.timeScale().fitContent();
        ro = new ResizeObserver((entries) => {
          chart?.applyOptions({ width: entries[0]?.contentRect.width ?? 600 });
        });
        if (ref.current) ro.observe(ref.current);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      ro?.disconnect();
      try {
        chart?.remove();
      } catch {
        /* ignore */
      }
    };
  }, [candles]);

  if (state === "loading") return <LoadingLine label="LOADING CHART..." />;
  if (failed || state === "error")
    return <div className="rounded-md border border-loss/40 p-4 font-mono text-xs text-loss">CHART ERROR. The feed died. I refuse to draw a guess.</div>;
  if (state === "unavailable" || !candles || candles.length === 0)
    return (
      <div className="rounded-md border border-tsun-border p-4 font-mono text-xs text-tsun-muted">
        CHART UNAAVAILABLE. {note ?? "No verified candles for this range."}
      </div>
    );
  return <div ref={ref} className="w-full" role="img" aria-label="Price chart" />;
}

export function TradeRow({ trade }: { trade: TsunTrade }) {
  return (
    <div className="flex items-center gap-3 border-b border-tsun-border/60 px-3 py-2 font-mono text-xs last:border-0">
      <span className={cn("w-10 font-bold", trade.side === "BUY" ? "text-profit" : "text-loss")}>{trade.side}</span>
      <span className="w-16 text-tsun-text">{trade.asset}</span>
      <span className="flex-1 text-tsun-muted">
        {trade.quantity.toLocaleString()} @ {fmtUsd(trade.price)}
      </span>
      <span className="text-tsun-text">{fmtUsd(trade.valueUsd)}</span>
      <span className="text-tsun-dim">{trade.verified ? "VERIFIED" : "SIMULATED"}</span>
    </div>
  );
}

export function TransactionLink({ signature, verified }: { signature?: string; verified: boolean }) {
  if (!verified || !signature) return <span className="font-mono text-[11px] text-tsun-dim">NO TX (SIMULATED)</span>;
  return (
    <a href={explorerTxUrl(signature)} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-tsun-text underline decoration-tsun-border underline-offset-2 hover:decoration-tsun-text">
      {signature.slice(0, 8)}...{signature.slice(-6)} ↗
    </a>
  );
}

export function CommentaryPanel({ mood, quote, latest }: { mood: TsunMood; quote: string; latest: AgentEvent | null }) {
  return (
    <div className="rounded-lg border border-tsun-border bg-tsun-panel p-3">
      <div className="font-mono text-[11px] tracking-[0.14em] text-tsun-muted">TSUN STATUS</div>
      <div className="mt-1 font-mono text-sm text-tsun-accent">{mood}</div>
      <p className="mt-1 text-sm text-tsun-text">“{quote}”</p>
      {latest && (
        <div className="mt-3 border-t border-tsun-border pt-2">
          <div className="font-mono text-[11px] tracking-[0.14em] text-tsun-muted">LATEST EVENT</div>
          <div className="mt-1 text-xs font-semibold text-tsun-text">{latest.title}</div>
          <div className="text-xs text-tsun-muted">{latest.body}</div>
        </div>
      )}
    </div>
  );
}
