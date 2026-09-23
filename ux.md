# TSUN UI / UX Specification

## 0. Objective

This document defines how TSUN should behave as an interface. It translates the product blueprint into concrete layouts, flows, windows, interactions, states, navigation, mobile behavior, notifications, and motion rules.

The key experience goal is:

**You do not visit TSUN's website. You enter TSUN's workstation.**

The site should borrow the world-building quality of the researched Stratton-style fictional workstation while remaining unmistakably modern, financial, responsive, and purpose-built for TSUN.

---

# 1. UX Principles

## 1.1 World first, utility second, decoration third

Every interface element should do at least one of these:

- help the user understand something
- let the user interact with TSUN
- make the world feel alive

Decorative effects that do none of the three should be removed.

## 1.2 Modern terminal underneath, fictional OS on top

Do not build a fake 1990s desktop and put charts inside it.

The foundation should be a modern responsive financial terminal.

The OS layer supplies:

- windows
- app icons
- files
- system status
- notifications
- lore
- easter eggs
- boot behavior

The financial layer supplies:

- live data
- charts
- market metrics
- portfolio information
- wallet analysis
- trades
- verifiable transactions

## 1.3 Chat is always nearby

TSUN chat is the primary human interaction surface.

On desktop, chat can exist as a full application.

On mobile, chat must be accessible from the fixed navigation and optionally from a persistent quick-action button.

## 1.4 Never trap the user in the fiction

The interface can be strange, but the actual information hierarchy must stay obvious.

For example:

```text
TSUN TERMINAL

TSUN $0.000123
+18.4% 24H
MCap $842K
```

The user should not have to discover a hidden file to learn the token price.

---

# 2. Global Information Architecture

## Desktop primary applications

```text
TSUN//OS
├── TSUN TERMINAL
├── TALK TO TSUN
├── MARKETS
├── MY MONEY
├── X//TSUN
├── TSUN TIMES
├── UNLOCKS
├── MEMORY
└── FILES
```

## Secondary actions

- connect wallet
- buy TSUN
- open explorer
- view public portfolio wallet
- open X
- mute sound
- reduce motion
- open settings
- view risk / disclosure information

## Persistent top bar

The top bar should always show a condensed market state.

Suggested structure:

```text
TSUN//OS        TSUN  +12.4%     SOL $212.31     MARKET OPEN     ● LIVE
```

Clicking the TSUN metric opens TSUN Terminal.

Clicking SOL opens Markets.

Clicking LIVE opens the data-status panel.

---

# 3. Boot Flow

## First visit

Sequence should be short and skippable after the first meaningful interaction.

### Frame 1

Black screen.

Tiny monospace system text begins appearing.

### Frame 2

```text
TSUN SYSTEMS BIOS v2.04
```

### Frame 3

System checks animate quickly.

```text
MEMORY ........ OK
NETWORK ........ OK
SOLANA RPC ..... OK
MARKET DATA .... OK
X CONNECTION ... OK
```

### Frame 4

Character state is loaded.

```text
MOOD ........... ANNOYED
RELATIONSHIP ... STRANGER
```

### Frame 5

```text
TSUN IS AWAKE.

Why are you here?
```

Then fade into desktop.

## Returning user

Remember the user's last state.

Example:

```text
WELCOME BACK.

LAST SESSION:
TSUN PORTFOLIO
MOOD: EMBARRASSED
```

Then open the previously active application unless the user is on mobile.

## Skip behavior

Show `SKIP` only after the boot sequence begins progressing.

After the user skips once, default to a compressed boot for later visits.

---

# 4. Desktop Shell

## 4.1 Layout zones

```text
┌────────────────────────────────────────────────────────────┐
│ GLOBAL MARKET BAR                                          │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│ DESKTOP ICONS │             APPLICATION AREA               │
│               │                                            │
│               │                                            │
│               │                                            │
├───────────────┴────────────────────────────────────────────┤
│ TASKBAR / DOCK                                             │
└────────────────────────────────────────────────────────────┘
```

## 4.2 Desktop icons

Use sparse icons, not a wall of icons.

Recommended initial icons:

- Terminal
- Talk to TSUN
- My Money
- X//TSUN
- TSUN Times
- Files
- Unlocks
- Recycle Bin

Lore files may appear after certain interactions.

## 4.3 Taskbar

Taskbar should show:

- TSUN logo / start control
- open applications
- system status
- wallet state
- clock
- sound toggle

The taskbar should not mimic Windows exactly.

It is a TSUN-specific workstation control bar.

---

# 5. Window System

Applications should open as floating panels on desktop.

## Window anatomy

```text
┌─────────────────────────────────────────────┐
│ ● ● ●   TSUN TERMINAL                LIVE  │
├─────────────────────────────────────────────┤
│                                             │
│               CONTENT                       │
│                                             │
└─────────────────────────────────────────────┘
```

The window header should include:

- app icon
- title
- optional state indicator
- minimize
- maximize
- close

Do not use browser-like cards everywhere.

The OS windows are containers for real product functionality.

## Window motion

Opening:

- scale from 0.97 to 1
- translate 6 to 12px upward
- fade in
- duration approximately 180 to 240ms

Closing:

- fade
- small scale down
- 120 to 160ms

Dragging should feel smooth but not overly springy.

---

# 6. TSUN TERMINAL UX

This is the default destination for market-oriented users.

## Top section

```text
TSUN / SOL
$0.000123
+18.2% 24H

MCap        $842K
Volume      $93K
Liquidity   $181K
Holders     1,482
```

Place the BUY TSUN action next to the token identity rather than burying it.

## Main chart

Chart should be the largest element.

Controls:

```text
1H  4H  1D  1W  ALL
```

Use a thin, serious chart treatment. Do not use exaggerated neon chart fills.

## Right-side commentary panel

Desktop only.

Show:

- current TSUN mood
- current quote
- latest market event
- current relationship-aware site notification

Example:

```text
TSUN STATUS

SMUG

"Finally. A number I can tolerate."
```

## Bottom market ribbon

Show BTC, SOL, TSUN, selected movers, and data age.

---

# 7. CHAT UX

## 7.1 Desktop

Split chat into three regions.

```text
┌───────────────┬───────────────────────────────┐
│ TSUN          │ CHAT                          │
│               │                               │
│ avatar        │ messages                      │
│ mood          │ tool cards                    │
│ relationship  │ notifications                 │
│ state         │                               │
│               │                               │
├───────────────┴───────────────────────────────┤
│ input                               SEND      │
└───────────────────────────────────────────────┘
```

## 7.2 Message types

### User message

Simple and clean.

### TSUN message

Use stronger identity styling.

Optional tiny status line:

```text
TSUN / ANNOYED
```

### Tool result

A factual card.

Example:

```text
LIVE MARKET DATA
SOL
$212.31
+4.72%
Updated 8s ago
```

Then TSUN can comment beneath it.

### System event

A small centered event row.

```text
TSUN MOOD CHANGED
ANNOYED → SMUG
```

## 7.3 Typing state

Do not show the generic three-dot chatbot bubble.

Use a TSUN-specific system state.

Examples:

```text
TSUN IS THINKING...
```

```text
FETCHING MARKET DATA...
```

```text
CHECKING YOUR WALLET...
```

```text
PRETENDING NOT TO CARE...
```

The last one should be rare and relationship-aware.

## 7.4 Long responses

Default to short responses.

If the user asks for a detailed explanation, allow longer structured responses.

Do not dump raw tool output into the chat.

---

# 8. MARKET EVENT UX

The site should have an event engine visible to the user without becoming noisy.

## Event severity

### Level 1: ambient

Ticker updates, subtle status changes.

### Level 2: notable

Large market movement, portfolio trade, X post.

Show a toast or small activity log.

### Level 3: major

Milestone reached, major portfolio event, significant TSUN move.

Show a full-screen event mode for approximately 2 to 4 seconds.

Example:

```text
┌─────────────────────────────────────┐
│                                     │
│          TSUN HAS HIT               │
│             $1M                     │
│                                     │
│   NEW CHARACTER STATE UNLOCKED      │
│                                     │
└─────────────────────────────────────┘
```

Then transition to the related unlock.

---

# 9. TSUN TIMES UX

TSUN Times should be a readable editorial surface rather than a fake image.

Desktop layout:

```text
┌──────────────────────────────────────────────┐
│ THE TSUN TIMES          VOL. 02     LIVE    │
├────────────────────┬─────────────────────────┤
│ MAIN HEADLINE      │ MARKET BOARD             │
│                    │                          │
│ large article      │ TSUN +18%                │
│                    │ SOL +4%                  │
├────────────────────┴─────────────────────────┤
│ smaller stories / portfolio / lore           │
└──────────────────────────────────────────────┘
```

Every generated headline should have:

- timestamp
- event source
- factual data when applicable
- link to the underlying activity

---

# 10. X//TSUN UX

The X application is a window into TSUN's real social existence.

Tabs:

```text
POSTS
PORTFOLIO
MARKET
MILESTONES
```

Each post should support:

- timestamp
- original X link
- media if available
- small event context badge when generated by a market event

Example badge:

```text
TRIGGERED BY TSUN +24% MOVE
```

Do not fabricate engagement counts if the live integration does not provide them.

---

# 11. MY MONEY UX

There are two distinct concepts and they must never be mixed:

### User wallet

Personal wallet analysis.

### TSUN portfolio

TSUN's public trading wallet.

Give them separate applications or unmistakable tabs.

Avoid language that implies the user controls or copies TSUN trades automatically.

---

# 12. Unlock UX

Use a timeline or terminal-style progression.

```text
TSUN EVOLUTION

$50K      ████████████ COMPLETE
$100K     ████████████ COMPLETE
$250K     ████████████ COMPLETE
$500K     █████░░░░░░░ LOCKED
$1M       ░░░░░░░░░░░░ LOCKED
```

Each milestone should expand to show:

- requirement
- date reached
- visual unlock
- dialogue unlock
- personality effect
- related X post
- artwork

Once a milestone is reached, it stays unlocked permanently.

---

# 13. FILES UX

The Files app is the main lore container.

Folders:

```text
/desktop
/wall-street
/portfolio
/memos
/market
/personal
/deleted
```

Some files are unlocked immediately.

Some appear after events.

Examples:

```text
wall_street_firing.txt
portfolio_excuses.txt
risk_management.txt
things_i_will_never_admit.txt
sol_analysis_FINAL_FINAL.txt
```

Opening files should feel like interacting with TSUN's own machine.

Do not make every file a joke. A few should contain useful lore, meaningful character moments, or hidden clues.

---

# 14. Global Notifications

Notifications can originate from:

- market events
- portfolio events
- X posts
- milestone unlocks
- memory events
- TSUN interactions

Examples:

```text
TSUN//ALERT

You looked at my portfolio again.
```

```text
TSUN//ALERT

SOL moved +6.1%.
TSUN is pretending this was expected.
```

Notifications should stack but auto-clear.

Allow mute.

Allow users to disable character notifications without disabling core market alerts.

---

# 15. Mobile UX

Mobile is a first-class experience, not the desktop site squeezed into a phone.

## Mobile shell

```text
┌────────────────────────────┐
│ TSUN   $0.00012    +18%     │
├────────────────────────────┤
│                            │
│      ACTIVE APP            │
│                            │
│                            │
├────────────────────────────┤
│ TERM  CHAT  MARKETS  ME    │
└────────────────────────────┘
```

Recommended mobile bottom navigation:

- Terminal
- Chat
- Markets
- Portfolio
- More

`More` contains:

- X//TSUN
- TSUN Times
- Unlocks
- Files
- Settings

## Mobile rules

- large enough tap targets
- no tiny window controls
- avoid multi-column data tables when stacked cards work
- charts should scroll horizontally if needed
- chat input must remain reachable
- boot sequence must fit within the screen
- desktop lore files should become cards or drawer panels
- do not make users drag windows on mobile

## Mobile desktop illusion

The desktop world can still exist through app transitions and system messages, but not through literal desktop window management.

---

# 16. Accessibility and Motion

Provide:

- reduced motion mode
- keyboard navigation
- visible focus states
- high contrast text
- semantic controls
- screen-reader labels
- no essential information conveyed only by color

Animations should support hierarchy, not distract from information.

---

# 17. Interaction Examples

## Example A: user asks about SOL

1. User opens Chat.
2. User asks "What's happening with SOL?"
3. UI shows `FETCHING MARKET DATA...`.
4. Tool fetches verified SOL data.
5. A live-data card appears.
6. TSUN comments in character.
7. No raw data dump.
8. Conversation summary is saved.

## Example B: user connects wallet

1. User clicks Connect.
2. Wallet selector opens.
3. User signs only required wallet connection/authentication message.
4. Public wallet data is loaded.
5. `MY MONEY` opens.
6. Factual wallet summary appears.
7. TSUN comments.
8. Wallet address is saved as user context, never as a secret.

## Example C: milestone reached

1. Market service detects ATH market-cap threshold.
2. Backend atomically marks milestone triggered.
3. Site receives event.
4. Desktop dims.
5. Milestone overlay appears.
6. New artwork loads.
7. New dialogue behavior becomes active.
8. Related X content is linked.
9. Unlock is permanent.

---

# 18. UX Anti-Patterns

Do not:

- build a generic hero page with a chatbot at the bottom
- make every feature a floating neon card
- hide factual data behind jokes
- make the retro effect so strong that charts become hard to read
- force a boot sequence every visit
- make the user hunt through fake files for core information
- let the desktop metaphor interfere with mobile usability
- show fake social metrics as real
- claim live market information without a live data source
- turn TSUN into a constantly screaming insult generator

The product is funny because the world is coherent, not because every pixel is trying to be a meme.
