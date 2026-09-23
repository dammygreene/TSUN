// Client providers: Solana connection + wallet adapter (wallet standard
// discovery, no extra wallet packages needed).
"use client";

import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { getRpcEndpoint } from "@/lib/solana/connection";

export function Providers({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    try {
      return getRpcEndpoint();
    } catch {
      return "https://api.mainnet-beta.solana.com";
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect onError={(e) => console.warn("wallet adapter:", e.message)}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
