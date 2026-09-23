# TSUN//OS

An interactive workstation prototype for **TSUN, the TradFi Tsundere**.

This repository turns the supplied product, visual, UX, and build documents into a responsive React application. It is deliberately built as a character world and financial terminal, not a token landing page.

## Run locally

```bash
npm install
npm run dev
```

Production validation:

```bash
npm run build
npm run lint
```

## What is implemented

- Skippable TSUN//OS boot flow with returning-user state
- Desktop workstation shell with draggable, focusable, minimizable, and maximizable application windows
- Intentional mobile app-shell variant with fixed navigation and a More drawer
- Global market bar, data freshness state, notifications, app launcher, taskbar, and local session clock
- Character visual core with mood-dependent visual treatment
- Stateful local chat with deterministic TSUN replies, relationship progression, browser-local memory, starter prompts, safety boundaries, and factual tool cards
- Verified SOL and BTC client-side market layer via CoinGecko with honest unavailable states
- Optional real TSUN token data layer via DexScreener, using a configurable public Solana mint address
- Non-custodial Phantom connection or public-address inspection with a real Solana mainnet balance request
- Clearly labeled simulated TSUN public portfolio, rather than fabricated live trading activity
- TSUN Times, X staging surface, permanent unlock timeline, memory inspector, and interactive lore files

## Public configuration

Copy `.env.example` to `.env.local` only when a verified public token mint is available:

```bash
VITE_TSUN_TOKEN_ADDRESS=your_verified_solana_mint
# Optional. If omitted, the deepest Solana pair returned by DexScreener is selected.
VITE_TSUN_PAIR_ADDRESS=your_verified_pair_address
```

`VITE_` values are exposed to the browser. They must never contain credentials, keys, signing secrets, or other private configuration.

Without a token mint, the UI intentionally keeps TSUN price, market-cap, liquidity, holder count, and volume unavailable. It does not invent those metrics.

## Truth and safety behavior

- No private key, recovery phrase, password, or signing secret is requested or persisted.
- Wallet inspection uses public address information only.
- The TSUN portfolio is clearly marked `SIMULATED MVP` until a distinct, verifiable public portfolio wallet is added.
- The X surface is a staging state until a real X API integration is configured. No unpublished draft is represented as a real post.
- If CoinGecko, DexScreener, or Solana RPC cannot be reached, the UI shows an unavailable state instead of a placeholder price.

## Architecture notes

- `src/lib/market.ts`: verified BTC/SOL market provider adapter
- `src/lib/token.ts`: optional token configuration and DexScreener pair adapter
- `src/lib/wallet.ts`: public-only Solana wallet connection and balance reader
- `src/lib/tsun.ts`: deterministic character, mood, relationship, memory, and safety behavior
- `src/components`: operating-system chrome and data-driven application surfaces
- `src/types.ts`: state and application contracts

The product documents in the repository remain the source of truth for future server persistence, LLM, indexer, wallet allocation, public portfolio, X API, and event-worker work.
