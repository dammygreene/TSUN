# TSUN Build Prompt for Coding Agent

## Role

You are the principal product engineer, UI engineer, motion designer, and systems architect responsible for building TSUN from this specification.

You are not building a generic token website.

You are building a production-quality interactive AI character world with a financial terminal at its core.

The product is called TSUN, TradFi Tsundere.

The site is TSUN's workstation.

---

# 1. Absolute Product Rules

Follow these rules before writing code:

1. TSUN is the product. The token is part of her world.
2. Chat is a flagship feature, not a widget attached to a landing page.
3. Live financial data must come from verified data sources.
4. Never fabricate current prices, market cap, holder counts, trades, PnL, rewards, or transactions.
5. Never request private keys or seed phrases.
6. Never access user assets.
7. Keep user wallets and TSUN's public trading wallet separate.
8. Do not enable real autonomous trading in the MVP.
9. Milestone unlocks are permanent once reached.
10. The site must work on mobile.
11. The OS metaphor must enhance the product, not block it.
12. Do not copy Stratton's site directly. Borrow the concept of a fictional workstation and create a distinct TSUN identity.
13. Avoid em dash characters in user-facing copy and code-generated copy.
14. Do not overuse neon gradients, glass cards, giant text, or generic Web3 aesthetics.
15. TSUN should be recognizable from her writing alone.

---

# 2. Build Order

Build in this order unless an existing repository requires a different safe dependency order.

## Stage 1: foundation

- inspect repository
- identify framework and existing architecture
- preserve useful existing code
- establish design tokens
- establish global shell
- establish responsive breakpoints
- establish API/service boundaries

## Stage 2: TSUN//OS shell

Build:

- boot screen
- desktop shell
- global market bar
- taskbar / mobile navigation
- application registry
- window manager
- notification manager
- state provider

## Stage 3: TSUN character system

Build:

- character context
- mood state
- relationship state
- memory service
- chat route
- conversation persistence

Use mocked or deterministic data first.

## Stage 4: terminal and data

Build:

- TSUN terminal
- market screen
- chart shell
- market cards
- token detail state
- data freshness indicator
- tool layer interfaces

## Stage 5: wallet and portfolio

Build:

- Solana wallet connection
- public wallet analysis
- TSUN demo portfolio
- portfolio detail
- trade history
- explorer-link architecture

## Stage 6: lore applications

Build:

- TSUN Times
- X//TSUN
- Unlocks
- Files
- Memory

## Stage 7: event engine

Build:

- market event dispatcher
- mood changes
- notifications
- milestone event system
- portfolio event system
- app reaction hooks

## Stage 8: polish

- motion
- sound hooks
- loading states
- error states
- mobile optimization
- accessibility
- performance
- QA

## Stage 9: post-MVP integrations

Only after the above is stable:

- real TSUN token data
- real holder data
- real TSUN portfolio wallet
- Jupiter
- X API posting
- milestone artwork generation
- automated X reactions
- filtered X replies

---

# 3. Recommended Architecture

Use a layered architecture.

```text
/app
/components
/components/os
/components/terminal
/components/chat
/components/portfolio
/components/lore
/components/markets
/lib
/lib/ai
/lib/market
/lib/solana
/lib/portfolio
/lib/memory
/lib/relationship
/lib/mood
/lib/events
/lib/x
/lib/database
/lib/security
/jobs
/types
```

Keep business logic out of presentation components wherever practical.

---

# 4. Global State

Create a central TSUN state model.

Example:

```ts
interface TsunState {
  mood: TsunMood
  relationship: RelationshipLevel
  currentQuote: string | null
  token: TokenState
  market: MarketState
  portfolio: PortfolioSummary
  activeEvents: AgentEvent[]
  user: UserContext | null
  dataStatus: DataStatus
}
```

Do not put live server-only secrets in client state.

---

# 5. Application Registry

Build an app registry so new TSUN//OS applications can be added without rewriting navigation.

Example:

```ts
interface TsunAppDefinition {
  id: string
  title: string
  icon: string
  component: React.ComponentType
  desktop: boolean
  mobile: boolean
  requiresWallet?: boolean
}
```

Applications:

```text
terminal
chat
markets
wallet
portfolio
x
newspaper
unlocks
memory
files
```

---

# 6. Window Manager

Desktop windows need:

- open
- close
- minimize
- maximize
- focus
- z-index ordering
- drag position
- width/height constraints

Keep the state in one window manager context.

Do not implement arbitrary window dragging on mobile.

Use full-screen views on mobile.

---

# 7. Boot Screen Implementation

Build the boot screen as a sequence controller, not a static screenshot.

State sequence:

```text
IDLE
→ BIOS
→ MEMORY
→ NETWORK
→ DATA
→ PORTFOLIO
→ USER
→ READY
```

Every state should support immediate skip.

Use actual data-status state when possible.

If real data is unavailable, show a clearly labeled fallback.

Do not pretend a connection succeeded if it did not.

---

# 8. Chat Architecture

Build chat with these modules:

```text
Chat UI
↓
Conversation API
↓
Context Builder
├── Character
├── Memory
├── Mood
├── Relationship
├── Market context
├── Portfolio context
└── Tool availability
↓
LLM
↓
Output Validator
↓
Memory Extractor
↓
Persist
```

The LLM must not directly decide factual financial numbers.

Tools provide factual numbers.

The model formats and explains them.

---

# 9. Tool Layer

Define interfaces such as:

```ts
getTokenPrice()
getTokenMarketCap()
getTokenVolume()
getTokenLiquidity()
getTokenHolders()
getSOLPrice()
getBTCPrice()
getTrendingTokens()
getMarketOverview()
getWalletPortfolio(address)
getWalletBalances(address)
getTSUNPortfolio()
getTSUNTrades()
```

Each tool response should have:

```ts
interface ToolResult<T> {
  ok: boolean
  data?: T
  error?: string
  fetchedAt: string
  source: string
}
```

Every live-data UI should be able to display data freshness.

---

# 10. Truth Guard

Before TSUN responds to any request requiring factual live data:

1. detect the required facts
2. fetch the data
3. verify the tool response
4. pass the structured result into model context
5. generate the response
6. validate that the response does not invent unsupported values

For unavailable data:

```text
FACT STATUS: UNAVAILABLE
```

The generated response must not fill the gap with a guess.

---

# 11. Memory System

Implement memory in layers:

### Short-term

Recent messages.

### Medium-term

Current conversation summary.

### Long-term

Persistent user relationship and key facts.

Example:

```ts
interface UserMemory {
  relationship: RelationshipLevel
  interactionCount: number
  firstSeenAt: string
  lastSeenAt: string
  discussedAssets: string[]
  summaries: string[]
  notes: string[]
}
```

Only store memory that is safe and useful.

---

# 12. Mood Engine

Create deterministic rules around events.

Example:

```ts
if (tsunChange >= 0.20) mood = 'SMUG'
if (tsunChange <= -0.20) mood = 'ANNOYED'
if (portfolioDrawdown >= 0.15) mood = 'EMBARRASSED'
if (userCompliment) mood = 'FLUSTERED'
if (milestoneReached) mood = 'HAPPY'
```

Use configurable thresholds.

Do not permanently overwrite mood for every tiny event.

Implement cooldowns and priority rules so the state does not flicker constantly.

Example priority:

```text
FURIOUS
PANICKING
ANGRY
EMBARRASSED
FLUSTERED
SMUG
HAPPY
ANNOYED
NORMAL
```

The exact priority can be tuned, but event collisions must have deterministic behavior.

---

# 13. Relationship Engine

Relationship progression should be event-based and persistent.

Keep a score or state internally, but expose only the named relationship level in the UI.

Avoid making token ownership a direct affection purchase mechanic.

Trigger meaningful behavior changes only when thresholds are reached.

---

# 14. Terminal Implementation

Build reusable financial components:

```text
MarketTicker
MetricBlock
PriceChart
MarketTable
MovementBadge
DataFreshness
PortfolioMetric
TradeRow
TransactionLink
CommentaryPanel
```

Every data component should support:

- loading
- loaded
- stale
- error
- unavailable

Never leave the user guessing whether a number is live.

---

# 15. Portfolio Implementation

Model positions and trades separately.

Example:

```ts
interface TsunTrade {
  id: string
  side: 'BUY' | 'SELL'
  asset: string
  quantity: number
  price: number
  valueUsd: number
  timestamp: string
  txSignature?: string
  verified: boolean
}
```

The UI should only label a trade as completed when it is verified or clearly marked simulated.

During MVP:

```text
MODE: SIMULATED
```

must be obvious.

---

# 16. Wallet Connection

Use a standard Solana wallet adapter flow.

Requirements:

- connect
- disconnect
- selected wallet display
- shortened address
- public balance read
- public token read
- no private key access

Never send sensitive wallet data to the LLM.

Only provide the derived public analysis needed for the response.

---

# 17. Event Bus

Create a lightweight internal event bus.

Example event types:

```ts
type AgentEventType =
  | 'MARKET_MOVE'
  | 'PORTFOLIO_TRADE'
  | 'PORTFOLIO_DRAW_DOWN'
  | 'MILESTONE_REACHED'
  | 'X_POST_PUBLISHED'
  | 'USER_RETURNED'
  | 'RELATIONSHIP_CHANGED'
  | 'MOOD_CHANGED'
```

Events can trigger:

- mood changes
- notifications
- chat context updates
- TSUN Times stories
- X post jobs
- unlocks
- character visual transitions

---

# 18. TSUN Times Generator

Generate stories from structured events, not free-form hallucination.

Input:

```json
{
  "event": "TSUN +31%",
  "priceChange": 0.31,
  "marketCap": 1000000,
  "mood": "SMUG"
}
```

Generate:

- headline
- subhead
- short body
- timestamp
- linked event

If market facts are present, the generated story must remain faithful to them.

---

# 19. X Integration

Use API-based publishing.

Create a queue for:

- market reactions
- original posts
- portfolio updates
- milestones

Each post should have:

```text
source event
created_at
status
content
media
x_post_id
```

Never auto-reply blindly to every mention.

Implement filtering before generation.

---

# 20. Milestone Engine

Use all-time-high market cap as the unlock condition.

Pseudo-flow:

```ts
if (marketCap >= target && milestone.status === 'LOCKED') {
  beginTransaction()
  markMilestoneReached()
  createUnlock()
  enqueueArtwork()
  enqueueXPost()
  commit()
}
```

The database should prevent duplicate triggering.

A milestone once unlocked must never relock because the current market cap falls.

---

# 21. Files / Lore System

Create a data-driven lore-file registry.

Example:

```ts
interface TsunFile {
  id: string
  path: string
  title: string
  type: 'text' | 'audio' | 'image' | 'executable'
  unlockCondition?: string
  body?: string
  eventTrigger?: string
}
```

Do not hard-code every file directly into the desktop component.

This allows the agent to add more lore later.

---

# 22. Error Handling

Every external integration must have clean error handling.

Show:

- what failed
- whether cached data exists
- when the last successful update occurred
- what the user can do next

Example:

```text
SOLANA DATA UNAVAILABLE

Last successful update: 18s ago

TSUN:
My feed died.
I refuse to guess.
```

---

# 23. Performance Rules

Do not allow the world-building layer to destroy page speed.

Rules:

- lazy load large character art
- lazy load secondary apps
- virtualize long chat history if needed
- cache market data appropriately
- avoid unnecessary animation loops
- respect reduced motion
- keep initial JS payload controlled
- preload only critical assets

The desktop shell should become interactive quickly.

---

# 24. Responsive Rules

Desktop has floating windows.

Mobile has application screens.

Do not implement a scaled version of desktop window management on a phone.

Use responsive component variants rather than CSS hacks.

---

# 25. Testing

### Character tests

Test that TSUN:

- remains rude
- does not become generic
- can be serious
- preserves relationship context
- does not fabricate numbers
- handles tool failures
- protects secrets
- responds differently to mood states

### UI tests

Test:

- boot
- opening applications
- closing windows
- window focus
- mobile navigation
- chart states
- wallet connection states
- errors
- notifications
- milestone event

### Data tests

Test:

- stale data
- missing data
- malformed response
- conflicting tool results
- API timeout
- API rate limit

---

# 26. Acceptance Criteria

The build is acceptable only when:

1. The homepage no longer feels like a normal token landing page.
2. The user immediately understands they are inside TSUN's workstation.
3. Chat works and remembers the user.
4. TSUN has recognizable mood and relationship state.
5. Market numbers are sourced, timestamped, and not invented.
6. The wallet experience is clearly non-custodial.
7. TSUN's portfolio is clearly separate from user wallets.
8. The OS metaphor works on desktop.
9. The app model works on mobile without window dragging.
10. Notifications and market events make the world feel alive.
11. Lore files add depth without hiding core features.
12. The design does not look like generic neon Web3.
13. The product remains useful when some integrations are unavailable.
14. Real autonomous trading is disabled in MVP.
15. Every major external action is auditable.

---

# 27. Implementation Behavior

When making design decisions not explicitly covered here:

Choose the option that makes TSUN feel more like a coherent, living workstation and less like a marketing website.

Prefer:

- real data over decorative fake data
- stateful interactions over static sections
- small personality moments over constant jokes
- high information density over giant hero text
- polished motion over flashy animation
- modular components over hard-coded pages
- mobile-first behavior over desktop-only cleverness

Do not ask the user to choose between obvious implementation details. Make sensible engineering decisions, document them in code comments where necessary, and keep the system reversible.

---

# 28. Implemented in this build

The chat architecture in section 8 is now live rather than planned:

```text
Chat UI (src/components/Chat.tsx)
  -> POST /api/chat (same origin in dev, preview, and serverless)
  -> Truth Guard (server/facts.ts builds the fact block from verified provider state)
  -> Context Builder (server/persona.ts: identity, voice weights, mood, relationship, memory)
  -> OpenRouter (primary, with a configurable model chain)
  -> Gemini (fallback, direct generateContent)
  -> Output Validator (server/facts.ts auditReply rejects unsupported money and percentage values)
  -> Local character engine (src/lib/tsun.ts) if every provider is unavailable
```

Supporting notes:

- Provider keys live in non `VITE_` variables and are read by the server handler only.
- `GET /api/chat` reports which providers are configured so the UI can state the model link honestly.
- The seeded simulated ledger was removed. The public desk stays empty and labelled until a real
  position source exists.
- Fictional surfaces (floor monitor, media player, phone dialer) generate atmosphere only. They
  state on screen that their figures and events are not real data.
