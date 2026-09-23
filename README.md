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
- **TALK TO TSUN** chat backed by OpenRouter with a Gemini fallback, driven by the character, mood, relationship, memory, and truth rules from the product docs
- Deterministic local character engine that answers in the same voice when no model key is configured or every provider fails
- Server side truth guard: the model only ever sees a fact block built from verified provider data, and any reply that quotes an unsupported number is rejected before it reaches the user
- Relationship progression, browser-local memory, starter prompts, TSUN-specific typing states, and a clickable desk check that runs her own diagnostics
- Fictional floor monitor, media player, and phone dialer that generate atmosphere without inventing a single metric
- Verified SOL and BTC client-side market layer via CoinGecko with honest unavailable states
- Optional real TSUN token data layer via DexScreener, using a configurable public Solana mint address
- Non-custodial Phantom connection or public-address inspection with a real Solana mainnet balance request
- Clearly labeled simulated TSUN public portfolio, rather than fabricated live trading activity
- TSUN Times, X staging surface, permanent unlock timeline, memory inspector, and interactive lore files

## Model link (TALK TO TSUN)

Chat is server backed. The browser posts to the same origin `/api/chat` route, and the handler owns the persona, the fact block, and the provider chain:

```text
browser -> /api/chat -> fact block -> persona prompt -> OpenRouter -> Gemini -> local engine
```

OpenRouter is always attempted first. Gemini is used only when OpenRouter is missing or fails. If both fail, the browser falls back to the deterministic engine in `src/lib/tsun.ts`, and the chat labels the reply as local rather than pretending.

Copy `.env.example` to `.env.local` and add at least one key:

```bash
OPENROUTER_API_KEY=sk-or-...
GEMINI_API_KEY=...
```

These variables are **not** prefixed with `VITE_`, so Vite never inlines them into the browser bundle. Keys are read by the server handler only.

Model defaults are configurable and safe to leave alone:

```bash
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1
OPENROUTER_FALLBACK_MODELS=x-ai/grok-4-fast,google/gemini-2.5-flash
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODELS=gemini-2.5-flash
```

`GET /api/chat` returns a small status payload describing which providers are configured, which the chat header uses to show `OPENROUTER`, `GEMINI FALLBACK`, or `LOCAL ENGINE` honestly.

### Deployment

`api/chat.ts` is a Node style serverless handler and works as a Vercel function at `POST /api/chat` with no further wiring. `vite.config.ts` mounts the same handler on the dev and preview servers, so `npm run dev` behaves like production.

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
- Chat replies cannot introduce a price, market cap, holder count, volume, liquidity figure, PnL, or wallet balance that was not present in the verified fact block. Unsupported figures are stripped by the server side audit instead of being shown to the user.
- The simulated portfolio seed was removed. The public desk stays empty and clearly labelled until a real position source is connected.
- The floor monitor, media player, and dialer are explicitly fictional decoration. They state on screen that their operators, calls, and quotas are not real data.

## Architecture notes

- `server/persona.ts`: TSUN identity, voice weights, mood, relationship, and the hard truth rules
- `server/facts.ts`: verified fact block builder plus the reply audit that blocks fabricated numbers
- `server/providers.ts`: OpenRouter then Gemini provider chain, model chains, and status reporting
- `server/chat.ts`: request orchestration for `POST /api/chat`
- `src/lib/chatClient.ts`: browser side call, provider metadata, and the local engine fallback
- `src/lib/providers.ts`: provider status hook used by the chat header
- `src/lib/tasks.ts`: deterministic desk check that never invents a metric
- `src/lib/market.ts`: verified BTC/SOL market provider adapter
- `src/lib/token.ts`: optional token configuration and DexScreener pair adapter
- `src/lib/wallet.ts`: public-only Solana wallet connection and balance reader
- `src/lib/tsun.ts`: deterministic character, mood, relationship, memory, and safety behavior
- `src/components`: operating-system chrome and data-driven application surfaces
- `src/types.ts`: state and application contracts

The product documents in the repository remain the source of truth for future server persistence, LLM, indexer, wallet allocation, public portfolio, X API, and event-worker work.
