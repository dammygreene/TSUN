// Solana helpers: RPC connection, explorer links, public wallet analysis.
// Non custodial. Reads public balances only. Never handles private keys.

import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { tokenConfig } from "@/lib/config";
import { getSOLPrice } from "@/lib/market/providers";
import type { ToolResult, WalletAnalysis, WalletHolding } from "@/types/tsun";

export function getRpcEndpoint(): string {
  if (tokenConfig.rpcUrl.trim()) return tokenConfig.rpcUrl;
  return clusterApiUrl((tokenConfig.network as "mainnet-beta" | "devnet" | "testnet") ?? "mainnet-beta");
}

let shared: Connection | null = null;

export function getConnection(): Connection {
  if (!shared) shared = new Connection(getRpcEndpoint(), "confirmed");
  return shared;
}

export function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function explorerTxUrl(signature: string): string {
  return `${tokenConfig.explorerUrl}/tx/${signature}`;
}

export function explorerAddressUrl(address: string): string {
  return `${tokenConfig.explorerUrl}/account/${address}`;
}

const STABLE_MINTS = new Set([
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
]);

function holdingSymbol(mint: string): string {
  if (mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") return "USDC";
  if (mint === "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB") return "USDT";
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

/**
 * Public wallet analysis. Only SOL and known stables get USD values, from
 * verified prices. Unknown tokens report amounts with null value, never a guess.
 */
export async function getWalletPortfolio(address: string): Promise<ToolResult<WalletAnalysis>> {
  const now = new Date().toISOString();
  let owner: PublicKey;
  try {
    owner = new PublicKey(address);
  } catch {
    return { ok: false, error: "INVALID_ADDRESS", fetchedAt: now, source: "Solana RPC" };
  }
  try {
    const conn = getConnection();
    const [lamports, tokenAccounts, solPrice] = await Promise.all([
      conn.getBalance(owner),
      conn.getParsedTokenAccountsByOwner(owner, { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }),
      getSOLPrice(),
    ]);
    const solBalance = lamports / LAMPORTS_PER_SOL;
    const solUsd = solPrice.ok && solPrice.data?.priceUsd != null ? solBalance * solPrice.data.priceUsd : null;

    const holdings: WalletHolding[] = [];
    if (solBalance > 0) {
      holdings.push({ mint: "So11111111111111111111111111111111111111112", symbol: "SOL", amount: solBalance, valueUsd: solUsd, pct: null });
    }
    let stableUsd = 0;
    for (const acc of tokenAccounts.value) {
      const info = acc.account.data.parsed?.info;
      const mint: string | undefined = info?.mint;
      const amount: number | undefined = info?.tokenAmount?.uiAmount;
      if (!mint || !amount || amount <= 0) continue;
      const isStable = STABLE_MINTS.has(mint);
      const valueUsd = isStable ? amount : null;
      if (isStable) stableUsd += amount;
      holdings.push({ mint, symbol: holdingSymbol(mint), amount, valueUsd, pct: null });
    }

    const pricedTotal = holdings.reduce((s, h) => s + (h.valueUsd ?? 0), 0);
    const unpriced = holdings.some((h) => h.valueUsd == null);
    const totalValueUsd = holdings.length === 0 ? 0 : unpriced ? null : Math.round(pricedTotal * 100) / 100;
    if (totalValueUsd) {
      for (const h of holdings) h.pct = h.valueUsd != null ? Math.round((h.valueUsd / totalValueUsd) * 1000) / 10 : null;
    }
    const largest = [...holdings].sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1))[0] ?? null;
    const stablePct = totalValueUsd ? Math.round((stableUsd / totalValueUsd) * 1000) / 10 : stableUsd > 0 ? null : 0;

    let concentrationNote: string | null = null;
    if (holdings.length === 0) concentrationNote = "Empty wallet. Bold strategy.";
    else if (largest?.pct != null && largest.pct >= 80) concentrationNote = `Heavy concentration: ${largest.symbol} is ${largest.pct}% of priced assets.`;
    else if (unpriced) concentrationNote = "Some tokens lack verified pricing, allocation is partial.";
    else concentrationNote = "Allocation is spread across priced assets.";

    return {
      ok: true,
      data: {
        address,
        solBalance: Math.round(solBalance * 1e6) / 1e6,
        totalValueUsd,
        holdings: holdings.slice(0, 25),
        largestHoldingSymbol: largest?.symbol ?? null,
        stablecoinPct: stablePct,
        concentrationNote,
      },
      fetchedAt: now,
      source: "Solana RPC",
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "RPC_FAILED", fetchedAt: now, source: "Solana RPC" };
  }
}

export async function getWalletBalances(address: string): Promise<ToolResult<WalletHolding[]>> {
  const r = await getWalletPortfolio(address);
  if (!r.ok || !r.data) return { ...r, data: undefined } as ToolResult<WalletHolding[]>;
  return { ...r, data: r.data.holdings };
}
