// MY MONEY. The USER wallet only. Strictly separate from TSUN's portfolio.
// Non custodial: connection + public reads, never keys, never fund movement.
"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ErrorBlock, LoadingLine, SectionLabel } from "@/components/os/ui";
import { DataFreshness, fmtUsd } from "@/components/terminal/primitives";
import { shortenAddress } from "@/lib/solana/connection";
import { useTsunStore } from "@/lib/state/store";
import { cn } from "@/lib/utils";
import type { DataState, ToolResult, WalletAnalysis } from "@/types/tsun";

function commentaryFor(w: WalletAnalysis): string {
  if (w.holdings.length === 0) return "Empty. Either a fresh wallet or a finished story. Fund it or frame it.";
  const top = w.largestHoldingSymbol ?? "something unpriced";
  if ((w.stablecoinPct ?? 0) >= 60) return `Mostly stables. Fear with a balance. Your largest holding is ${top}.`;
  return `Largest holding ${top}. ${w.concentrationNote ?? ""}`.trim();
}

export default function WalletApp() {
  const { publicKey, wallets, select, connect, disconnect, connecting, connected } = useWallet();
  const openApp = useTsunStore((s) => s.openApp);
  const setActiveMobileApp = useTsunStore((s) => s.setActiveMobileApp);
  const setWalletAddress = useTsunStore((s) => s.setWalletAddress);
  const addRelationship = useTsunStore((s) => s.addRelationship);

  const [analysis, setAnalysis] = useState<ToolResult<WalletAnalysis> | null>(null);
  const [state, setState] = useState<DataState>("loading");
  const address = publicKey?.toBase58() ?? null;

  const load = useCallback(async (addr: string) => {
    setState("loading");
    try {
      const res = await fetch(`/api/wallet?address=${encodeURIComponent(addr)}`, { cache: "no-store" });
      const body = (await res.json()) as ToolResult<WalletAnalysis>;
      setAnalysis(body);
      setState(body.ok ? (body.stale ? "stale" : "loaded") : "error");
    } catch {
      setAnalysis(null);
      setState("error");
    }
  }, []);

  useEffect(() => {
    setWalletAddress(address);
    if (address) {
      addRelationship("wallet_connect");
      void load(address);
    } else {
      setAnalysis(null);
      setState("loading");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const openPortfolio = () => {
    openApp("portfolio");
    setActiveMobileApp("portfolio");
  };

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-lg border border-tsun-accent/40 bg-tsun-panel p-3">
        <div className="font-mono text-[11px] tracking-[0.14em] text-tsun-accent">YOUR WALLET. NOT TSUN'S.</div>
        <p className="mt-1 text-xs text-tsun-muted">
          This app reads your public wallet only. TSUN cannot move your funds and never asks for keys. Her demo book lives separately in{" "}
          <button onClick={openPortfolio} className="underline underline-offset-2 hover:text-tsun-text">Portfolio</button>.
        </p>
      </div>

      {!connected || !address ? (
        <div className="rounded-lg border border-tsun-border bg-tsun-panel p-4">
          <SectionLabel>Connect a Solana wallet</SectionLabel>
          <p className="mt-1 text-xs text-tsun-muted">
            Non custodial connection. You approve a connection message only. No seed phrase, no private key, ever.
          </p>
          {wallets.length === 0 ? (
            <p className="mt-3 font-mono text-xs text-tsun-muted">
              {connecting ? "CONNECTING..." : "No wallet detected in this browser. Install Phantom or Solflare, then retry."}
            </p>
          ) : (
            <div className="mt-3 grid gap-2">
              {wallets.map((w) => (
                <button
                  key={w.adapter.name}
                  disabled={connecting}
                  onClick={() => {
                    select(w.adapter.name);
                    void connect().catch(() => undefined);
                  }}
                  className="rounded-md border border-tsun-border bg-tsun-void px-3 py-2.5 text-left text-sm text-tsun-text transition-colors hover:border-tsun-borderLight disabled:opacity-50"
                >
                  Connect {w.adapter.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-tsun-border bg-tsun-panel p-3">
            <div>
              <SectionLabel>Connected</SectionLabel>
              <div className="mt-0.5 font-mono text-sm text-tsun-text">{shortenAddress(address)}</div>
            </div>
            <button
              onClick={() => void disconnect()}
              className="rounded-md border border-tsun-border px-3 py-1.5 font-mono text-xs text-tsun-muted hover:text-tsun-text"
            >
              DISCONNECT
            </button>
          </div>

          {state === "loading" && <LoadingLine label="READING WALLET..." />}
          {state === "error" && (
            <ErrorBlock title="WALLET READ FAILED" tsun="The RPC ignored me. Rude. Check the address and retry." retry={() => void load(address)} />
          )}
          {analysis?.ok && analysis.data && (
            <>
              <div className="flex items-center justify-between">
                <SectionLabel>Wallet facts</SectionLabel>
                <DataFreshness fetchedAt={analysis.fetchedAt} source={analysis.source} state={state} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Total value", analysis.data.totalValueUsd != null ? fmtUsd(analysis.data.totalValueUsd) : "PARTIAL"],
                  ["SOL", analysis.data.solBalance != null ? analysis.data.solBalance.toFixed(4) : "--"],
                  ["Largest", analysis.data.largestHoldingSymbol ?? "--"],
                  ["Stables", analysis.data.stablecoinPct != null ? `${analysis.data.stablecoinPct}%` : "--"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-tsun-border bg-tsun-panel px-3 py-2">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-tsun-muted">{label}</div>
                    <div className="mt-0.5 font-mono text-sm text-tsun-text">{value}</div>
                  </div>
                ))}
              </div>
              {analysis.data.totalValueUsd == null && (
                <p className="font-mono text-[11px] text-tsun-dim">Total is PARTIAL: some tokens lack verified pricing and are excluded rather than guessed.</p>
              )}
              <div className="overflow-x-auto rounded-lg border border-tsun-border">
                <table className="w-full min-w-[420px] border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-tsun-border text-left text-tsun-muted">
                      <th className="px-3 py-2 font-normal">TOKEN</th>
                      <th className="px-3 py-2 text-right font-normal">AMOUNT</th>
                      <th className="px-3 py-2 text-right font-normal">VALUE</th>
                      <th className="px-3 py-2 text-right font-normal">PCT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.data.holdings.map((h) => (
                      <tr key={h.mint} className="border-b border-tsun-border/60 last:border-0">
                        <td className="px-3 py-2 text-tsun-text">{h.symbol}</td>
                        <td className="px-3 py-2 text-right text-tsun-muted">{h.amount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-tsun-text">{h.valueUsd != null ? fmtUsd(h.valueUsd) : "n/a"}</td>
                        <td className={cn("px-3 py-2 text-right", h.pct != null ? "text-tsun-text" : "text-tsun-dim")}>{h.pct != null ? `${h.pct}%` : "--"}</td>
                      </tr>
                    ))}
                    {analysis.data.holdings.length === 0 && (
                      <tr><td colSpan={4} className="px-3 py-3 text-center text-tsun-dim">No token balances found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border border-tsun-border bg-tsun-panel p-3">
                <SectionLabel>TSUN commentary</SectionLabel>
                <p className="mt-1 text-sm text-tsun-text">{commentaryFor(analysis.data)}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
