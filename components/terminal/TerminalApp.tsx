// TSUN TERMINAL. Default desk: token header, chart, commentary, ribbon.
"use client";

import { useCallback, useEffect, useState } from "react";
import { DataBadge, EmptyBlock, ErrorBlock } from "@/components/os/ui";
import {
  CommentaryPanel,
  DataFreshness,
  fmtPct,
  fmtUsd,
  MarketTicker,
  MetricBlock,
  MovementBadge,
  PriceChart,
} from "@/components/terminal/primitives";
import { isTokenConfigured, tokenConfig } from "@/lib/config";
import { useTsunStore } from "@/lib/state/store";
import { cn } from "@/lib/utils";
import type { Candle, DataState, ToolResult } from "@/types/tsun";

const RANGES = ["1H", "4H", "1D", "1W", "ALL"] as const;
type Range = (typeof RANGES)[number];

export default function TerminalApp() {
  const market = useTsunStore((s) => s.market);
  const dataStatus = useTsunStore((s) => s.dataStatus);
  const mood = useTsunStore((s) => s.mood);
  const currentQuote = useTsunStore((s) => s.currentQuote);
  const activeEvents = useTsunStore((s) => s.activeEvents);

  const [range, setRange] = useState<Range>("1D");
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [chartState, setChartState] = useState<DataState>("loading");
  const [chartSource, setChartSource] = useState("GeckoTerminal");
  const [chartAt, setChartAt] = useState<string | null>(null);

  const loadCandles = useCallback(async (r: Range) => {
    setChartState("loading");
    try {
      const res = await fetch(`/api/candles?range=${r}`, { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const body = (await res.json()) as ToolResult<Candle[]>;
      setChartSource(body.source);
      setChartAt(body.fetchedAt);
      if (body.ok && body.data) {
        setCandles(body.data);
        setChartState(body.stale ? "stale" : "loaded");
      } else {
        setCandles(null);
        setChartState(body.error === "NOT_CONFIGURED" ? "unavailable" : "error");
      }
    } catch {
      setCandles(null);
      setChartState("error");
    }
  }, []);

  useEffect(() => {
    void loadCandles(range);
  }, [range, loadCandles]);

  const tsun = market?.tsun ?? null;
  const configured = isTokenConfigured();
  const ticker = (market?.movers ?? []).map((m) => ({
    symbol: m.symbol,
    price: m.priceUsd != null ? fmtUsd(m.priceUsd) : "--",
    change: m.change24h,
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-auto p-3">
        {/* Token header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-xs text-tsun-muted">{configured ? tokenConfig.pair : "TSUN/SOL (NOT CONFIGURED)"}</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-tsun-text">
                {tsun?.priceUsd != null ? fmtUsd(tsun.priceUsd) : "UNAVAILABLE"}
              </span>
              <MovementBadge change={tsun?.change24h} />
              <span className="font-mono text-[11px] text-tsun-dim">24H</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <DataBadge state={dataStatus.market} />
            {configured ? (
              <a
                href={`https://dexscreener.com/solana/${tokenConfig.mint}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-tsun-text px-4 py-2 text-xs font-bold text-black transition-transform active:translate-y-px"
              >
                BUY TSUN
              </a>
            ) : (
              <span className="cursor-not-allowed rounded-md border border-tsun-border px-4 py-2 font-mono text-xs text-tsun-dim" title="Token mint not configured">
                BUY: NOT CONFIGURED
              </span>
            )}
          </div>
        </div>

        {/* Metrics */}
        {tsun ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <MetricBlock label="Market cap" value={fmtUsd(tsun.marketCapUsd)} />
            <MetricBlock label="Volume 24h" value={fmtUsd(tsun.volume24hUsd)} />
            <MetricBlock label="Liquidity" value={fmtUsd(tsun.liquidityUsd)} />
            <MetricBlock label="Holders" value={tsun.holders != null ? tsun.holders.toLocaleString() : "UNAVAILABLE"} />
            <MetricBlock label="SOL" value={market?.sol?.priceUsd != null ? fmtUsd(market.sol.priceUsd) : "--"} sub={fmtPct(market?.sol?.change24h)} />
            <MetricBlock label="BTC" value={market?.btc?.priceUsd != null ? fmtUsd(market.btc.priceUsd) : "--"} sub={fmtPct(market?.btc?.change24h)} />
          </div>
        ) : dataStatus.market === "error" ? (
          <ErrorBlock
            title="MARKET DATA UNAVAILABLE"
            tsun="My feed died. I refuse to guess. Try again in a moment."
            retry={() => window.location.reload()}
          />
        ) : (
          <EmptyBlock title="TSUN TOKEN" body={configured ? "Waiting for the first verified quote. The terminal never shows guesses." : "Token mint is NOT CONFIGURED. Supply NEXT_PUBLIC_TSUN_MINT to enable live TSUN data. SOL and BTC still load."} />
        )}

        {/* Chart + commentary */}
        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <div className="rounded-lg border border-tsun-border bg-tsun-panel p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex gap-1" role="tablist" aria-label="Chart range">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    role="tab"
                    aria-selected={range === r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "rounded px-2 py-1 font-mono text-[11px] transition-colors",
                      range === r ? "bg-tsun-panel2 text-tsun-text" : "text-tsun-dim hover:text-tsun-text",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <DataFreshness fetchedAt={chartAt} source={chartSource} state={chartState} />
            </div>
            <PriceChart candles={candles} state={chartState} note={configured ? undefined : "Token mint is NOT CONFIGURED."} />
          </div>
          <CommentaryPanel mood={mood} quote={currentQuote} latest={activeEvents[0] ?? null} />
        </div>
      </div>
      <MarketTicker items={ticker} />
    </div>
  );
}
