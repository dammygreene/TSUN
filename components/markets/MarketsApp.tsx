// MARKETS. Board, movers, sentiment. Rows open the terminal.
"use client";

import { DataFreshness, MarketTable } from "@/components/terminal/primitives";
import { SectionLabel } from "@/components/os/ui";
import { useTsunStore } from "@/lib/state/store";

export default function MarketsApp() {
  const market = useTsunStore((s) => s.market);
  const dataStatus = useTsunStore((s) => s.dataStatus);
  const openApp = useTsunStore((s) => s.openApp);
  const setActiveMobileApp = useTsunStore((s) => s.setActiveMobileApp);

  const rows = [market?.sol, market?.btc, market?.tsun].filter((q) => q != null);

  const openTerminal = () => {
    openApp("terminal");
    setActiveMobileApp("terminal");
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <SectionLabel>Market board</SectionLabel>
        <DataFreshness fetchedAt={dataStatus.lastUpdatedAt} source="CoinGecko+DexScreener" state={dataStatus.market} />
      </div>
      {rows.length > 0 ? (
        <MarketTable rows={rows} onSelect={openTerminal} />
      ) : (
        <div className="rounded-lg border border-tsun-border bg-tsun-panel p-4 font-mono text-xs text-tsun-muted">
          BOARD UNAVAILABLE. {dataStatus.market === "error" ? "Providers failed, cached data will appear if any exists." : "Waiting for the first verified snapshot."}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-tsun-border bg-tsun-panel p-3">
          <SectionLabel>Sentiment</SectionLabel>
          <div className="mt-1 font-mono text-lg text-tsun-text">{market?.sentiment ?? "UNKNOWN"}</div>
          <div className="mt-1 text-xs text-tsun-muted">Derived from verified SOL and BTC moves. TSUN editorializes for free.</div>
        </div>
        <div className="rounded-lg border border-tsun-border bg-tsun-panel p-3">
          <SectionLabel>Coverage</SectionLabel>
          <div className="mt-1 font-mono text-lg text-tsun-text">{rows.length}/3</div>
          <div className="mt-1 text-xs text-tsun-muted">Assets with verified quotes. Missing ones are labeled, never faked.</div>
        </div>
      </div>
      <p className="font-mono text-[11px] text-tsun-dim">Tap a row to open it in the terminal. Charts only render verified candles.</p>
    </div>
  );
}
