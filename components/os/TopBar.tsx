// Persistent global market bar. Condensed market state, always visible.
"use client";

import { useState } from "react";
import { useTsunStore } from "@/lib/state/store";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/os/ui";

function fmtPrice(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "--";
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(6)}`;
}

function fmtChg(frac: number | null | undefined): string {
  if (typeof frac !== "number" || !Number.isFinite(frac)) return "--";
  const pct = frac * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

export function TopBar({ onOpenApp }: { onOpenApp: (app: "terminal" | "markets") => void }) {
  const market = useTsunStore((s) => s.market);
  const token = useTsunStore((s) => s.token);
  const dataStatus = useTsunStore((s) => s.dataStatus);
  const [showStatus, setShowStatus] = useState(false);

  const tsun = token ?? market?.tsun ?? null;
  const sol = market?.sol ?? null;
  const live = dataStatus.market === "loaded";

  return (
    <header className="relative z-40 flex h-10 shrink-0 items-center gap-2 border-b border-tsun-border bg-tsun-ink px-3 font-mono text-xs sm:gap-4 sm:px-4">
      <span className="font-bold tracking-[0.18em] text-tsun-text">
        TSUN<span className="text-tsun-accent">//</span>OS
      </span>
      <button
        onClick={() => onOpenApp("terminal")}
        className="flex items-center gap-1.5 rounded px-1 py-1 transition-colors hover:bg-tsun-panel sm:hidden"
        aria-label="Open TSUN Terminal"
      >
        <span className="text-tsun-text">{tsun?.priceUsd != null ? fmtPrice(tsun.priceUsd) : "--"}</span>
        <span className={cn((tsun?.change24h ?? 0) >= 0 ? "text-profit" : "text-loss")}>{fmtChg(tsun?.change24h)}</span>
      </button>
      <button
        onClick={() => onOpenApp("terminal")}
        className="hidden items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-tsun-panel sm:flex"
        aria-label="Open TSUN Terminal"
      >
        <span className="text-tsun-muted">TSUN</span>
        <span className="text-tsun-text">{tsun?.priceUsd != null ? fmtPrice(tsun.priceUsd) : "UNAVAILABLE"}</span>
        <span className={cn((tsun?.change24h ?? 0) >= 0 ? "text-profit" : "text-loss")}>{fmtChg(tsun?.change24h)}</span>
      </button>
      <button
        onClick={() => onOpenApp("markets")}
        className="hidden items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-tsun-panel md:flex"
        aria-label="Open Markets"
      >
        <span className="text-tsun-muted">SOL</span>
        <span className="text-tsun-text">{sol?.priceUsd != null ? fmtPrice(sol.priceUsd) : "--"}</span>
      </button>
      <span className="ml-auto hidden text-tsun-dim sm:inline">MARKET OPEN</span>
      <button
        onClick={() => setShowStatus((v) => !v)}
        className="ml-auto flex items-center gap-1.5 rounded px-2 py-1 text-tsun-text transition-colors hover:bg-tsun-panel sm:ml-0"
        aria-expanded={showStatus}
        aria-label="Data status"
      >
        <StatusDot tone={live ? "live" : dataStatus.market === "stale" ? "syncing" : "offline"} pulse={!live} />
        {live ? "LIVE" : dataStatus.market.toUpperCase()}
      </button>
      {showStatus && (
        <div className="absolute right-2 top-11 w-64 rounded-lg border border-tsun-border bg-tsun-panel p-3 shadow-xl" role="dialog" aria-label="Data status panel">
          <div className="mb-2 text-[11px] tracking-[0.14em] text-tsun-muted">DATA STATUS</div>
          {(
            [
              ["Market feed", dataStatus.market],
              ["Solana RPC", dataStatus.solanaRpc],
              ["TSUN token", dataStatus.tsunToken],
            ] as const
          ).map(([label, state]) => (
            <div key={label} className="flex items-center justify-between py-1 text-xs">
              <span className="text-tsun-muted">{label}</span>
              <span className="text-tsun-text">{state.toUpperCase()}</span>
            </div>
          ))}
          <div className="mt-2 border-t border-tsun-border pt-2 text-[11px] text-tsun-dim">
            {dataStatus.lastUpdatedAt ? `Updated ${new Date(dataStatus.lastUpdatedAt).toLocaleTimeString()}` : "No successful update yet"}
          </div>
        </div>
      )}
    </header>
  );
}
