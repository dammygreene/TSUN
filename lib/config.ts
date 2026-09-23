// Central runtime config. Token mechanics are configurable, never hard coded.
// Every integration is env gated with an honest offline fallback.

export const tokenConfig = {
  /** Solana mint for TSUN. Empty until a real mint is supplied. */
  mint: process.env.NEXT_PUBLIC_TSUN_MINT ?? "",
  pair: process.env.NEXT_PUBLIC_TSUN_PAIR ?? "TSUN/SOL",
  supply: process.env.NEXT_PUBLIC_TSUN_SUPPLY ?? "",
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "",
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta",
  explorerUrl: (process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://solscan.io").replace(/\/$/, ""),
} as const;

export function isTokenConfigured(): boolean {
  return tokenConfig.mint.trim().length > 0;
}

/** Server side provider keys. All optional. Unset means honest UNAVAILABLE. */
export const serverConfig = {
  coingeckoApiKey: process.env.COINGECKO_API_KEY ?? "",
  heliusApiKey: process.env.HELIUS_API_KEY ?? "",
  birdeyeApiKey: process.env.BIRDEYE_API_KEY ?? "",
  llmProvider: process.env.TSUN_LLM_PROVIDER ?? "none",
  databaseUrl: process.env.DATABASE_URL ?? "",
} as const;

export function hasLlmProvider(): boolean {
  return serverConfig.llmProvider !== "none";
}

export const appConfig = {
  name: "TSUN//OS",
  character: "TSUN",
  fullIdentity: "TradFi Tsundere",
  /** Market cache TTLs. */
  marketFreshMs: 30_000,
  marketStaleMs: 120_000,
} as const;
