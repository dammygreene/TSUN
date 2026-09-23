# TSUN Visual Design System

## 0. Visual Thesis

**Wall Street terminal × hostile anime AI × Crypto X × fictional workstation.**

The visual language should feel like a serious financial workstation that has been contaminated by an arrogant anime trading AI and internet culture.

The site should be premium, distinctive, dark, dense, and alive.

It should not look like:

- a generic Solana memecoin site
- a standard AI chat application
- a generic dark dashboard template
- a direct Windows 95 copy
- a neon cyberpunk landing page
- a casino interface
- an AI-generated design collage

---

# 1. Visual Strategy

Use this weighting as a starting point:

**70% modern financial terminal**  
**20% fictional operating system**  
**10% internet/anime chaos**

The ratios are visual, not literal CSS values.

The financial terminal gives the product credibility.

The fictional OS gives it identity.

The chaos gives it personality.

---

# 2. Color System

The base palette should be nearly black, graphite, charcoal, muted silver, and off-white.

Do not create a rainbow interface.

### Base

```text
VOID          #050505
INK           #090909
GRAPHITE      #111111
PANEL         #151515
PANEL-2       #1B1B1B
BORDER        #282828
BORDER-LIGHT  #343434
TEXT          #F1F1ED
TEXT-MUTED    #8A8A86
TEXT-DIM      #555552
```

### Functional accents

Use accent color as information, not decoration.

**Profit green** for positive PnL and positive market movement.  
**Loss red** for negative PnL, danger, and adverse events.  
**TSUN accent** should be a restrained warm pink-red or rose tone used primarily for identity and emotional states, not everywhere.

Keep the interface mostly monochrome.

A strong accent should feel rare.

---

# 3. Surfaces

Panels should look like physical surfaces inside one coherent system.

Use:

- solid dark backgrounds
- subtle inner borders
- 1px separators
- soft shadows only when layering is required
- restrained blur for overlays

Avoid:

- excessive glassmorphism
- large transparent gradients
- giant glow halos
- rounded cards everywhere

Corner radii should be small to medium.

Recommended:

```text
Window: 10px
Panel: 8px
Button: 6px
Badge: 999px only for status pills
```

Do not make every container a pill.

---

# 4. Typography

The product needs two worlds of typography.

## Primary UI font

Use a clean modern grotesk such as:

- Inter
- Geist
- Space Grotesk

Prefer one primary family throughout the real interface.

## Monospace

Use a readable technical monospace for:

- terminal output
- file names
- data values
- system boot text
- timestamps
- transaction hashes
- debug/lore snippets

Possible choices:

- IBM Plex Mono
- JetBrains Mono
- Geist Mono

Do not make the entire website monospace.

---

# 5. Type Scale

Suggested desktop scale:

```text
Display       48-72px
Page title    28-40px
Section       18-24px
UI large      16-18px
UI body       14-16px
Small         12-13px
Micro         10-11px
Terminal      11-14px
```

Use large text sparingly.

The site should prioritize information density rather than enormous hero typography.

---

# 6. Grid

Use a disciplined grid.

Desktop:

- 12-column content grid
- consistent 16 to 24px spacing rhythm
- clear alignment between metrics, charts, and panels

Tablet:

- 8 columns

Mobile:

- 4 columns
- 16px page gutters
- 8 to 16px component spacing

Use the grid aggressively to make the interface feel engineered.

---

# 7. Borders and Dividers

Borders should be visible but quiet.

Use:

```text
1px solid #282828
```

for most separators.

Use stronger borders for active application headers and selected states.

Do not outline everything.

Empty space is also a separator.

---

# 8. The TSUN Character

TSUN is the emotional center of the system.

Her character art should not simply sit in a hero section.

It should behave like a system avatar.

Possible states:

- NORMAL
- ANNOYED
- SMUG
- EMBARRASSED
- ANGRY
- FLUSTERED
- HAPPY
- PANICKING
- DERE

### Visual state changes

Use small differences:

- eyes
- expression
- posture
- lighting
- background treatment
- UI accent
- tiny motion

Do not replace the entire UI theme every time mood changes.

### Character art placement

Best placements:

- chat side panel
- system boot
- milestone reveals
- portfolio commentary
- terminal status card
- major event overlays

Character art should feel embedded in the product, not pasted above it.

---

# 9. Avatar State Motion

### Normal

Very subtle idle movement.

### Annoyed

Small head movement or eye shift.

### Smug

Slight confident motion, subtle smile.

### Embarrassed

Look away or brief red/pink visual accent.

### Angry

Sharper transitions, short shake, red status flash.

### Panicking

Rare pulse and compressed UI rhythm.

### Dere

Slower, softer movement and warmer accent.

Motion should remain tasteful.

---

# 10. Market Motion

Market data should feel alive without becoming distracting.

When a live value changes:

1. update numeric value
2. briefly brighten the number
3. animate a tiny background tick
4. update delta
5. settle immediately

Do not animate numbers continuously when nothing changed.

For large movement:

- chart gets a stronger stroke transition
- ticker flashes briefly
- event notification may appear
- TSUN mood may update

---

# 11. Retro Layer

The retro influence should appear through:

- BIOS screens
- file names
- system messages
- window headers
- terminal text
- old-office references
- tiny scanline or noise layers
- faux file metadata
- error messages

It should not appear through:

- permanent CRT distortion
- unreadable pixel fonts
- fake low-resolution layout
- Windows 95 button styling everywhere
- giant scanlines over critical financial content

Use retro effects mainly during transitions, lore, easter eggs, and special events.

---

# 12. Texture

The background should not be flat black.

Use very subtle atmospheric layers:

- grain
- fine grid
- barely visible scan texture
- soft radial lighting near active windows
- tiny data marks
- faint vertical lines

The user should notice the texture only after looking closely.

---

# 13. Desktop Background

The desktop background can contain a faint financial terminal grid.

Possible layers:

```text
base void
↓
soft radial gradient
↓
market grid
↓
subtle noise
↓
very faint data traces
```

No giant logos.

No busy illustrations.

The desktop should feel like an expensive private trading workstation.

---

# 14. Buttons

Buttons should look like system controls, not SaaS components.

Primary:

```text
BUY TSUN
```

or

```text
TALK TO TSUN
```

Use high contrast.

Secondary actions should be quieter.

Danger actions should use the loss color.

Avoid huge gradient buttons.

Use small micro-interactions:

- 1 to 2px translate on press
- subtle brightness change
- optional tiny border animation

---

# 15. Status Indicators

Status indicators are a key part of the world.

Examples:

```text
● LIVE
● CONNECTED
● SYNCING
● OFFLINE
● MOOD: SMUG
● PORTFOLIO: OPEN
```

Use a tiny dot plus text.

Do not turn every status into a colored pill.

---

# 16. Iconography

Use simple technical icons.

Preferred characteristics:

- thin or medium stroke
- geometric
- compact
- slightly industrial

Avoid cartoon icons.

TSUN can have custom icons for:

- terminal
- chat
- wallet
- portfolio
- X
- times
- files
- unlocks

The icons should feel like software from TSUN's operating system.

---

# 17. Charts

Charts should look credible enough to belong on a serious trading system.

Use:

- thin lines
- subtle area fills only when useful
- clear axis labels
- restrained grid lines
- readable tooltips
- minimal visual noise

Avoid:

- glowing rainbow charts
- thick neon candlesticks
- fake depth effects
- decorative 3D graphs

The character should add the chaos, not the chart.

---

# 18. Financial Data Hierarchy

Use typography to establish hierarchy.

Example:

```text
TSUN / SOL                 14px mono muted
$0.000123                  34px bold
+18.42%                    14px green

MARKET CAP                 11px muted
$842,391                   18px mono
```

Never make every number huge.

---

# 19. Chat Visual Language

TSUN messages should feel like outputs from a personality-driven financial system.

Use:

- strong speaker marker
- subtle mood label
- clear body text
- compact data attachments

Example:

```text
TSUN / SMUG

Obviously.

SOL is up 4.7% today. Try not to confuse a green candle with a personality.
```

The factual data card can sit below:

```text
SOL
$212.31
+4.72%
8s ago
```

---

# 20. Error States

Errors should be truthful and in character.

Never hide a system failure behind a joke.

Example:

```text
MARKET DATA UNAVAILABLE

TSUN:
My feed is down.
No, I am not inventing the number.
Try again in a moment.
```

The interface should still clearly communicate the actual failure.

---

# 21. Loading States

Do not use generic spinners everywhere.

Use contextual loading states.

Examples:

```text
LOADING MARKET DATA...
```

```text
CHECKING SOLANA...
```

```text
READING WALLET...
```

```text
ASKING TSUN...
```

For longer operations, show progress information.

---

# 22. TSUN Times Visual Style

Use newspaper influence without making the interface look like a paper texture website.

Design:

- strong editorial headline
- thin rules
- small serif or display accent only for the newspaper title if desired
- body text in the primary UI font
- small market table
- tiny timestamp and source tags

It should feel like a financial newspaper generated from inside TSUN's world.

---

# 23. X//TSUN Visual Style

Use a restrained social feed treatment.

Do not clone the full X interface.

Focus on:

- TSUN identity
- post text
- media
- timestamp
- event context
- open-on-X action

The user should immediately understand that these are TSUN's real posts.

---

# 24. Lore Files Visual Style

Files should use a more monospace-heavy visual language.

Example:

```text
> /wall-street/risk_management.txt

LAST MODIFIED: 09:42
STATUS: CORRUPTED
OWNER: TSUN

"Risk management is just fear with a spreadsheet."
```

Do not make every document too long.

Small details create the illusion of depth.

---

# 25. Milestone Reveal Design

When a milestone is reached:

1. pause normal ambient motion
2. darken the UI slightly
3. show a large system message
4. reveal the target
5. introduce artwork
6. reveal the new behavior
7. return the user to the active application

Example:

```text
TSUN//EVENT

MARKET CAP THRESHOLD REACHED

$1,000,000

NEW STATE UNLOCKED
DATE NIGHT
```

The artwork reveal should feel like a product event, not a generic confetti effect.

---

# 26. Responsive Design

The site must feel intentional at:

- 320px
- 375px
- 390px
- 430px
- 768px
- 1024px
- 1280px
- 1440px+

At small widths:

- reduce information density
- stack panels
- preserve important metrics
- replace floating windows with full-screen app views
- keep chat accessible

At large widths:

- use negative space intentionally
- allow multi-panel terminal layouts
- show character alongside information

---

# 27. Sound

Sound should be optional and disabled or low by default.

Possible sounds:

- boot click
- window open
- market tick
- error tone
- milestone chime
- message receive

Never use constant background music without a user opt-in.

A media player easter egg can exist inside TSUN//OS.

---

# 28. Motion System

Recommended motion principles:

**Micro interaction:** 100 to 160ms  
**Window interaction:** 180 to 260ms  
**Panel transition:** 220 to 350ms  
**Major event:** 700 to 1400ms total sequence  

Use easing that feels smooth and controlled.

Avoid over-springy motion.

Financial software should feel deliberate.

---

# 29. Mobile Visual Adaptation

Do not simply remove desktop features.

Convert them:

- windows → full-screen app layers
- taskbar → bottom navigation
- file desktop → Files drawer
- floating notification stack → compact toast stack
- side character panel → collapsible header state
- multi-column terminal → stacked cards

The personality should remain.

The usability should improve.

---

# 30. Visual QA Checklist

Before shipping any page, verify:

- Does it still look good with all data visible?
- Does it look like TSUN rather than a generic crypto dashboard?
- Are accents restrained?
- Can numbers be read quickly?
- Is the character art integrated rather than pasted on?
- Are retro effects helping the fiction instead of hurting usability?
- Does the page still work when market data is unavailable?
- Does mobile feel designed, not compressed?
- Is the UI hierarchy obvious within two seconds?
