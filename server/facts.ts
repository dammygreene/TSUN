/**
 * Truth layer. Builds the fact block the model is allowed to quote, and audits the generated reply
 * so unsupported numbers never reach the user (build-prompt.md section 10).
 *
 * All values arrive from the client as a snapshot of state that the client already fetched from a
 * named provider. Nothing here invents a value: a missing value is rendered as UNAVAILABLE.
 */

export interface ChatSnapshot {
  mood?: string
  relationship?: string
  interactionCount?: number
  firstSeenAt?: string | null
  lastSeenAt?: string | null
  discussedAssets?: string[]
  notes?: string[]
  market?: {
    status?: string
    source?: string
    fetchedAt?: string | null
    error?: string | null
    solPrice?: number | null
    solChange24h?: number | null
    btcPrice?: number | null
    btcChange24h?: number | null
  }
  token?: {
    configured?: boolean
    status?: string
    fetchedAt?: string | null
    priceUsd?: number | null
    change24h?: number | null
    marketCap?: number | null
    volume24h?: number | null
    liquidityUsd?: number | null
    pairLabel?: string | null
    error?: string | null
  }
  wallet?: {
    connected?: boolean
    solBalance?: number | null
    balanceFetchedAt?: string | null
    error?: string | null
  }
  portfolio?: {
    simulated?: boolean
    nav?: number | null
    costBasis?: number | null
    pnl?: number | null
    pnlPct?: number | null
    winRatePct?: number | null
    closedTrades?: number | null
  }
}

export interface FactBlock {
  text: string
  /** Numbers the reply is allowed to quote as money. */
  money: number[]
  /** Numbers the reply is allowed to quote as percentages. */
  percents: number[]
}

const money = (value: number) =>
  Math.abs(value) >= 1000
    ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : Math.abs(value) >= 1
      ? `$${value.toFixed(2)}`
      : `$${value.toFixed(7)}`

const pct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

function freshness(iso: string | null | undefined) {
  if (!iso) return 'never'
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.round(minutes / 60)}h ago`
}

export function buildFactBlock(snapshot: ChatSnapshot): FactBlock {
  const lines: string[] = []
  const moneyValues: number[] = []
  const percentValues: number[] = []

  lines.push(`CLOCK: ${new Date().toISOString()} (UTC)`)

  const market = snapshot.market ?? {}
  const marketLive = market.status === 'live'
  lines.push(
    `MARKET FEED: ${marketLive ? 'LIVE' : (market.status ?? 'unavailable').toUpperCase()}${market.source ? ` via ${market.source}` : ''}, last update ${freshness(market.fetchedAt)}.`,
  )
  if (!marketLive) {
    lines.push('MARKET PRICES: FACT STATUS UNAVAILABLE. You cannot quote a SOL or BTC price right now.')
  }
  const sol = typeof market.solPrice === 'number' ? market.solPrice : null
  const solChange = typeof market.solChange24h === 'number' ? market.solChange24h : null
  lines.push(sol !== null ? `SOL: ${money(sol)}, 24h ${solChange !== null ? pct(solChange) : 'change unavailable'}` : 'SOL: FACT STATUS UNAVAILABLE')
  if (sol !== null) moneyValues.push(sol)
  if (solChange !== null) percentValues.push(solChange)

  const btc = typeof market.btcPrice === 'number' ? market.btcPrice : null
  const btcChange = typeof market.btcChange24h === 'number' ? market.btcChange24h : null
  lines.push(btc !== null ? `BTC: ${money(btc)}, 24h ${btcChange !== null ? pct(btcChange) : 'change unavailable'}` : 'BTC: FACT STATUS UNAVAILABLE')
  if (btc !== null) moneyValues.push(btc)
  if (btcChange !== null) percentValues.push(btcChange)

  const token = snapshot.token ?? {}
  if (!token.configured) {
    lines.push(
      'TSUN TOKEN: NOT CONFIGURED in this build. No contract address is set, so price, market cap, holders, volume and liquidity for TSUN are all FACT STATUS UNAVAILABLE. Never guess the contract address.',
    )
  } else if (token.status === 'live' && typeof token.priceUsd === 'number') {
    lines.push(
      `TSUN TOKEN: ${token.pairLabel ?? 'TSUN/SOL'} at ${money(token.priceUsd)}${typeof token.change24h === 'number' ? `, 24h ${pct(token.change24h)}` : ''}${typeof token.marketCap === 'number' ? `, market cap ${money(token.marketCap)}` : ', market cap unavailable'}${typeof token.volume24h === 'number' ? `, 24h volume ${money(token.volume24h)}` : ''}${typeof token.liquidityUsd === 'number' ? `, liquidity ${money(token.liquidityUsd)}` : ''}. Holders: FACT STATUS UNAVAILABLE.`,
    )
    moneyValues.push(token.priceUsd)
    if (typeof token.change24h === 'number') percentValues.push(token.change24h)
    if (typeof token.marketCap === 'number') moneyValues.push(token.marketCap)
    if (typeof token.volume24h === 'number') moneyValues.push(token.volume24h)
    if (typeof token.liquidityUsd === 'number') moneyValues.push(token.liquidityUsd)
  } else {
    lines.push(
      `TSUN TOKEN: a contract address is configured but the feed is UNAVAILABLE (${token.error ?? 'no provider response'}). You cannot quote TSUN price, market cap, holders, volume or liquidity right now.`,
    )
  }

  const portfolio = snapshot.portfolio ?? {}
  if (portfolio.simulated && typeof portfolio.nav === 'number') {
    const pnl = typeof portfolio.pnl === 'number' ? portfolio.pnl : null
    const pnlPct = typeof portfolio.pnlPct === 'number' ? portfolio.pnlPct : null
    lines.push(
      `TSUN PORTFOLIO (SIMULATED, NOT REAL MONEY): NAV ${money(portfolio.nav)}${typeof portfolio.costBasis === 'number' ? `, cost basis ${money(portfolio.costBasis)}` : ''}${pnl !== null ? `, total PnL ${pnl >= 0 ? '+' : '-'}${money(Math.abs(pnl))}` : ''}${pnlPct !== null ? ` (${pct(pnlPct)})` : ''}${typeof portfolio.winRatePct === 'number' ? `, win rate ${portfolio.winRatePct.toFixed(0)}% on ${portfolio.closedTrades ?? '?'} closed simulated trades` : ''}. If you mention any of this, label it simulated.`,
    )
    moneyValues.push(portfolio.nav)
    if (typeof portfolio.costBasis === 'number') moneyValues.push(portfolio.costBasis)
    if (pnl !== null) moneyValues.push(Math.abs(pnl))
    if (pnlPct !== null) percentValues.push(pnlPct)
    if (typeof portfolio.winRatePct === 'number') percentValues.push(portfolio.winRatePct)
  }

  const wallet = snapshot.wallet ?? {}
  if (wallet.connected && typeof wallet.solBalance === 'number') {
    lines.push(
      `USER WALLET (public read only): SOL balance ${wallet.solBalance.toFixed(5)} SOL, read ${freshness(wallet.balanceFetchedAt)} from Solana mainnet RPC. Token holdings for this user are FACT STATUS UNAVAILABLE.`,
    )
    moneyValues.push(wallet.solBalance)
  } else if (wallet.connected) {
    lines.push(`USER WALLET: connected but the public balance read is UNAVAILABLE (${wallet.error ?? 'no provider response'}).`)
  } else {
    lines.push('USER WALLET: not connected. You cannot see any balance or holdings for this user.')
  }

  lines.push(
    'Anything not listed above, including news, other tokens, on chain activity and the user\'s private situation, is FACT STATUS UNAVAILABLE. Say you cannot verify it.',
  )

  return { text: lines.join('\n'), money: moneyValues, percents: percentValues }
}

const ALLOWED_MONEY_ALWAYS = [0, 1]
const ALLOWED_PERCENT_ALWAYS = [0, 1, 100]

function within(value: number, allowed: number[]) {
  return allowed.some((candidate) => Math.abs(value - candidate) <= Math.max(0.011, Math.abs(candidate) * 0.01))
}

export interface AuditResult {
  ok: boolean
  offending: string[]
}

/**
 * Rejects a draft that quotes money or percentage values the fact block never provided.
 * Small integers and figures of speech are tolerated; invented prices are not.
 */
export function auditReply(reply: string, facts: FactBlock): AuditResult {
  const offending: string[] = []

  const moneyPattern = /\$\s?([0-9][\d,]*(?:\.[0-9]+)?)([KMB])?(?![A-Za-z0-9])/g
  for (const match of reply.matchAll(moneyPattern)) {
    const base = Number(match[1].replace(/,/g, ''))
    if (!Number.isFinite(base)) continue
    const suffix = (match[2] ?? '').toUpperCase()
    const multiplier = suffix === 'K' ? 1_000 : suffix === 'M' ? 1_000_000 : suffix === 'B' ? 1_000_000_000 : 1
    const value = base * multiplier
    if (!within(value, facts.money) && !within(base, ALLOWED_MONEY_ALWAYS)) offending.push(match[0].trim())
  }

  const percentPattern = /([0-9][\d,]*(?:\.[0-9]+)?)\s?%/g
  for (const match of reply.matchAll(percentPattern)) {
    const value = Number(match[1].replace(/,/g, ''))
    if (!Number.isFinite(value)) continue
    if (!within(value, facts.percents) && !within(value, ALLOWED_PERCENT_ALWAYS)) offending.push(match[0].trim())
  }

  return { ok: offending.length === 0, offending }
}
