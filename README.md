# TSUN//OS. TradFi Tsundere Workstation

TSUN is a persistent fictional AI character: a rude ex Wall Street trading AI with a
public trading portfolio, a market terminal, and lore. This repo is her workstation,
not a token landing page. Chat is the flagship feature.

## Quickstart

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest, 40+ tests
npm run build    # production build
```

Copy `.env.example` to `.env.local` for optional integrations. The app runs with
zero keys and degrades to honest `UNAVAILABLE` states.

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_TSUN_MINT` | TSUN token mint. Empty means NOT CONFIGURED, never faked | empty |
| `NEXT_PUBLIC_TSUN_PAIR` | Display pair | `TSUN/SOL` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Custom RPC endpoint | public cluster |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `mainnet-beta`, `devnet`, `testnet` | `mainnet-beta` |
| `NEXT_PUBLIC_EXPLORER_URL` | Explorer base for tx links | Solscan |
| `COINGECKO_API_KEY` | Higher market rate limits (server) | free tier |
| `TSUN_LLM_PROVIDER` | `none`, `openai`, `anthropic` | `none` |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | LLM drafts (server, optional) | unset |

With `TSUN_LLM_PROVIDER=none` (default) the deterministic local character engine
answers every turn. LLM drafts, when enabled, still pass the truth guard.

## Architecture

```text
app/                  Next.js routes: page shell + /api/*
components/os         Boot, desktop, windows, taskbar, mobile nav, notifications
components/chat       Flagship chat app
components/terminal   Financial primitives + terminal app
components/markets    Market board
components/apps       Wallet (user) and Portfolio (TSUN, simulated)
components/lore       Times, X staging feed, Unlocks, Memory, Files
lib/ai                Character prompt, deterministic engine, truth guard, LLM adapter
lib/market            Tool layer providers (ToolResult envelope, cache, freshness)
lib/mood              Deterministic mood engine
lib/relationship      Event based relationship engine
lib/memory            Layered memory + storage abstraction
lib/milestones        Permanent ATH unlock engine
lib/events            Client event bus
lib/solana            RPC, explorer links, public wallet analysis
lib/portfolio         Simulated TSUN book
lib/x                 Staging feed (labeled, no fake engagement)
lib/times             Event driven newspaper generator
lib/files             Lore file registry
lib/security          Input filters, rate limiting, audit log
lib/database          Postgres schema (production target)
lib/state             Central zustand store (window manager included)
types/                Shared domain types
```

State in production: Postgres per `lib/database/schema.sql`. MVP sandbox state:
localStorage on the client, in memory on the server, same idempotent semantics.

## Non negotiables

- Never fabricate prices, caps, holders, trades, PnL, rewards, or tx hashes.
- Numbers come only from tools returning `ToolResult`. The LLM never decides them.
- Missing facts render as `FACT STATUS: UNAVAILABLE`.
- Never request or store private keys or seed phrases.
- User wallets and TSUN's portfolio stay strictly separate.
- Portfolio is `MODE: SIMULATED` until real trading ships.
- No real autonomous trading in the MVP.
- Milestones unlock once and never relock.
- No em dashes in user facing or generated copy.
- Mobile is first class: full screen apps, no window dragging.

## Specs

The product specs live in the repo root: `blueprint.md` (product),
`build-prompt.md` (build order + acceptance), `design.md` (visual system),
`ux.md` (interactions), `plan.md` (phases).
