# TSUN Build Plan

## 0. Objective

This plan converts the TSUN product specification into an execution sequence that a coding agent can follow without losing the product vision.

The goal is not simply to finish pages. The goal is to progressively build a coherent interactive world.

The correct order is:

**world shell → character → data → interaction → events → social → autonomous systems → polish**

Do not jump directly to real-money autonomous trading.

---

# Phase 0: Repository and Architecture Audit

## Goal

Understand the existing codebase before changing it.

## Tasks

- inspect package manager
- inspect framework
- inspect app routing
- inspect environment files
- inspect existing API routes
- inspect component tree
- inspect data layer
- inspect existing authentication
- inspect existing wallet integration
- inspect styling system
- inspect deployment configuration
- identify code worth preserving
- identify dead code

## Deliverable

Create a short internal architecture map.

Example:

```text
Web app
API
Database
AI layer
Wallet layer
Market layer
Worker
```

Do not rewrite the repository simply because a cleaner architecture is theoretically possible.

---

# Phase 1: Design System Foundation

## Goal

Establish a reusable visual system before building all the screens.

## Tasks

- create color tokens
- create typography tokens
- create spacing tokens
- create radii tokens
- create shadows
- create border styles
- create status colors
- create motion tokens
- build base buttons
- build base inputs
- build base panels
- build status components
- build metric components

## Acceptance

The app should already visually resemble TSUN after this phase.

No generic dashboard defaults should remain.

---

# Phase 2: TSUN//OS Shell

## Goal

Make the website feel like a fictional workstation.

## Build

- boot screen
- desktop background
- global market bar
- desktop icons
- application registry
- taskbar
- window manager
- mobile navigation
- notification system skeleton

## Acceptance

A user can launch applications from a coherent shell.

The desktop feels like TSUN owns it.

---

# Phase 3: Character Core

## Goal

Make TSUN behave like TSUN before adding complicated market integrations.

## Build

- base character prompt
- personality layers
- response style rules
- mood engine
- relationship engine
- memory extraction
- conversation persistence
- chat UI

## Test prompts

Test:

- basic greeting
- crypto question
- insult
- compliment
- repeated return
- portfolio mockery
- serious financial hardship
- secret request
- prompt injection
- request for live market data

## Acceptance

The character should feel recognizable without visual context.

---

# Phase 4: Live Data Layer

## Goal

Give TSUN trustworthy market context.

## Build

- market data provider abstraction
- TSUN token data interface
- SOL data
- BTC data
- market summary
- trending assets
- data freshness handling
- stale state
- error state

## Acceptance

The chat can answer a market question from verified tool output.

No invented values.

---

# Phase 5: TSUN Terminal

## Goal

Create the central financial workstation.

## Build

- token header
- price metric
- market cap
- volume
- liquidity
- holders
- chart
- market movers
- TSUN commentary
- data-status panel

## Acceptance

This should look like a serious trading terminal that happens to belong to TSUN.

---

# Phase 6: Wallet Experience

## Goal

Let users voluntarily connect a public Solana wallet for analysis.

## Build

- wallet adapter
- connect / disconnect
- address display
- public balance reader
- token allocation
- wallet activity summary
- wallet analysis API
- TSUN commentary layer

## Acceptance

The user clearly understands:

- no private key is required
- this is non-custodial
- TSUN cannot move their funds

---

# Phase 7: TSUN Portfolio

## Goal

Create the public trading storyline.

## Build with simulated data first

- NAV
- total PnL
- realized PnL
- unrealized PnL
- win rate
- positions
- closed trades
- best trade
- worst trade
- drawdown
- transaction-link placeholders
- simulated/live mode badge

## Acceptance

The portfolio page tells a story and feels auditable.

Never label simulated activity as real.

---

# Phase 8: TSUN Times + X//TSUN

## Goal

Extend the world beyond dashboard functionality.

## TSUN Times

Build:

- newspaper shell
- main headline
- market board
- event stories
- portfolio stories
- lore stories

## X//TSUN

Build:

- TSUN feed
- post cards
- milestone posts
- market reactions
- portfolio commentary
- links to original X posts

## Acceptance

The site feels like it is observing a character who exists outside the product.

---

# Phase 9: Files and Lore

## Goal

Add curiosity and depth.

## Build

Initial files:

```text
README_TSUN.txt
wall_street_firing.txt
risk_management.txt
portfolio_excuses.txt
sol_analysis_FINAL_FINAL.txt
things_i_will_never_admit.txt
HUMILITY.exe
tsuno_mix.mp3
```

Only some files should be visible at launch.

Others can unlock through events.

## Acceptance

Users who explore should discover deeper TSUN personality.

Users who do not explore should still have a complete product.

---

# Phase 10: Event Engine

## Goal

Make the site react to the world.

## Build

Event bus for:

- market movement
- TSUN movement
- trade
- portfolio PnL change
- milestone
- X post
- user return
- relationship change
- mood change

## Reactions

Events may trigger:

- notifications
- mood changes
- TSUN quotes
- UI state changes
- TSUN Times stories
- X post jobs
- unlocks

## Acceptance

The site should no longer feel static when the user is not actively clicking.

---

# Phase 11: Milestones

## Goal

Create a long-term progression system.

## Build

Milestones:

```text
$50K
$100K
$250K
$500K
$1M
$2.5M
$5M
$10M
```

## Build components

- milestone registry
- ATH trigger logic
- permanent unlock state
- artwork assignment
- dialogue unlock
- visual-state unlock
- X post link
- event overlay

## Acceptance

A milestone can only unlock once and cannot relock.

---

# Phase 12: Motion and Atmosphere Pass

## Goal

Turn the functional product into the polished TSUN world.

## Add

- boot animation
- window transitions
- market number transitions
- character motion
- event overlays
- subtle grain
- market grid
- status pulses
- hover micro-interactions
- reduced-motion support

## Acceptance

Animations should make the product feel alive without hurting readability or performance.

---

# Phase 13: Mobile Pass

## Goal

Make mobile feel like a deliberate product.

## Tasks

- replace floating windows with app screens
- build bottom navigation
- simplify terminal layout
- optimize chat input
- optimize chart interaction
- test 320px width
- test 375px width
- test 390px width
- test 430px width

## Acceptance

A user can complete the full core experience on a phone.

---

# Phase 14: Truth, Safety, and Failure Pass

## Goal

Make the system resilient and trustworthy.

## Test

- market provider down
- stale data
- wallet provider down
- LLM timeout
- database timeout
- malformed tool output
- rate limits
- duplicate milestone triggers
- duplicate X posts
- prompt injection
- secret extraction attempt
- transaction spoof attempt

## Acceptance

The system should fail honestly.

A failure message may sound like TSUN, but the actual status must remain clear.

---

# Phase 15: Real Integrations

Do this only after the previous phases are stable.

## Integrate

- real TSUN token data
- real holder data
- real market cap
- real public trading wallet
- Jupiter
- X API
- artwork generation
- automated X posting

## Trading rule

Use only explicitly allocated TSUN funds.

Never access user assets.

Never copy trades into users automatically.

Never manufacture token volume.

Every real trade must be verifiable.

---

# Phase 16: Autonomous Agent

## Goal

Allow TSUN to exist as an autonomous character outside the website.

## Worker loops

### Market refresh

Approximately every 30 minutes.

### Original post evaluation

Approximately every 2 hours.

### Portfolio commentary

Approximately every 6 hours.

### Immediate event reaction

Triggered by large TSUN move, portfolio event, or milestone.

### X mention processing

Only after filtering.

---

# Phase 17: X Safety Layer

## Build filters

Reject or quarantine:

- prompt injection
- scam links
- suspicious contract instructions
- malicious requests
- secret extraction attempts
- harassment bait
- sensitive-topic bait where inappropriate
- instructions to execute transactions

Generate responses only after the input passes policy and relevance checks.

---

# Phase 18: QA and Character Review

## Character QA

Review sampled conversations manually.

Questions:

- Does this sound like TSUN?
- Is she too friendly?
- Is she repeating the same insults?
- Does she use useful data when appropriate?
- Does she handle serious contexts correctly?
- Does she preserve user history?
- Does mood visibly affect behavior?

## Product QA

Questions:

- Does the workstation metaphor remain coherent?
- Are core features easy to find?
- Is financial data legible?
- Are retro effects restrained?
- Does mobile work?
- Are real and simulated states obvious?

---

# Phase 19: Launch Readiness

## Required

- production environment configuration
- secret management
- logging
- error monitoring
- analytics
- database backups
- rate limiting
- abuse controls
- wallet integration testing
- X API testing
- market-data failover
- legal/risk disclosures where applicable
- mobile testing
- performance testing

---

# Phase 20: Post-Launch Iteration

Track:

- first chat interaction rate
- repeat chat rate
- average conversation length
- returning user rate
- number of wallet connections
- TSUN Times engagement
- unlock page visits
- X post clicks
- market terminal usage
- time spent in TSUN//OS
- easter egg discovery

Do not optimize only for token clicks.

The strongest signal is whether people return to interact with TSUN when there is no immediate market incentive.

---

# Priority Order

If time becomes limited, use this order:

1. TSUN character quality
2. chat and memory
3. TSUN//OS shell
4. live data accuracy
5. terminal
6. wallet analysis
7. public portfolio
8. event engine
9. unlocks
10. X//TSUN
11. TSUN Times
12. lore files
13. autonomous posting
14. autonomous trading

Never sacrifice character quality just to add more integrations.

---

# Definition of Done

The product is ready for public use when a new visitor can:

1. enter TSUN//OS
2. understand what TSUN is within seconds
3. see real market information
4. talk to TSUN
5. receive a recognizable character response
6. return later and be remembered
7. optionally connect a public wallet
8. inspect TSUN's public portfolio
9. discover the fictional workstation world
10. see milestones and unlocks
11. follow TSUN's external social activity
12. use the core experience comfortably on mobile

The site should feel like a living financial workstation, not a polished landing page.
