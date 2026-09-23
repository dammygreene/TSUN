import { Activity, CircleAlert, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { filterChartRange } from '../lib/market'
import { cn, formatCurrency, formatPercent, formatRelativeTime } from '../lib/format'
import type { MarketState, TokenState, TsunMood } from '../types'
import { Avatar } from './Avatar'

interface TerminalProps {
  market: MarketState
  token: TokenState
  mood: TsunMood
  onRefresh: () => void
  onOpenChat: () => void
}

type ChartRange = '1H' | '4H' | '1D' | '1W' | 'ALL'

function Metric({ label, value, pending = false }: { label: string; value: string; pending?: boolean }) {
  return (
    <div className="metric-block">
      <span>{label}</span>
      <strong className={pending ? 'metric-pending' : ''}>{value}</strong>
    </div>
  )
}

function SolChart({ market }: { market: MarketState }) {
  const [range, setRange] = useState<ChartRange>('1W')
  const points = useMemo(() => filterChartRange(market.chartPrices, range), [market.chartPrices, range])
  const path = useMemo(() => {
    if (points.length < 2) return ''
    const values = points.map(([, price]) => price)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const spread = max - min || max * 0.015 || 1
    return points
      .map(([, value], index) => {
        const x = (index / (points.length - 1)) * 100
        const y = 88 - ((value - min) / spread) * 68
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }, [points])
  const first = points[0]?.[1]
  const last = points[points.length - 1]?.[1]
  const change = first && last ? ((last - first) / first) * 100 : null

  return (
    <div className="chart-module">
      <div className="chart-module-header">
        <div>
          <span className="eyebrow">SOL MARKET CONTEXT</span>
          <strong>{market.assets.solana ? formatCurrency(market.assets.solana.priceUsd) : 'DATA UNAVAILABLE'}</strong>
          {change !== null && <span className={cn('chart-change', change >= 0 ? 'positive' : 'negative')}>{formatPercent(change)} selected range</span>}
        </div>
        <div className="range-controls" aria-label="Chart range">
          {(['1H', '4H', '1D', '1W', 'ALL'] as ChartRange[]).map((value) => (
            <button key={value} type="button" className={cn(range === value && 'selected')} onClick={() => setRange(value)}>{value}</button>
          ))}
        </div>
      </div>
      {path ? (
        <div className="chart-wrap">
          <div className="chart-y-label top">{formatCurrency(Math.max(...points.map(([, value]) => value)))}</div>
          <div className="chart-y-label bottom">{formatCurrency(Math.min(...points.map(([, value]) => value)))}</div>
          <svg className="price-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Solana market price chart">
            <defs>
              <linearGradient id="solFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(115, 205, 150, .25)" />
                <stop offset="100%" stopColor="rgba(115, 205, 150, 0)" />
              </linearGradient>
            </defs>
            <path d="M0 22H100M0 50H100M0 78H100" className="chart-grid-lines" />
            <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#solFill)" className="chart-area" />
            <path d={path} className={cn('chart-path', (change ?? 0) >= 0 ? 'positive' : 'negative')} vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="chart-x-axis"><span>{range === 'ALL' ? '30D AGO' : `${range} AGO`}</span><span>NOW</span></div>
        </div>
      ) : (
        <div className="chart-empty">
          <Activity size={20} />
          <div><strong>No verified chart points available</strong><span>The terminal leaves the chart empty instead of drawing a fictional market.</span></div>
        </div>
      )}
    </div>
  )
}

export function Terminal({ market, token, mood, onRefresh, onOpenChat }: TerminalProps) {
  const sol = market.assets.solana
  const freshness = market.fetchedAt ? formatRelativeTime(market.fetchedAt) : 'awaiting source'
  const tokenReady = token.status === 'live' && token.priceUsd !== null
  const pendingTokenValue = token.address ? 'UNAVAILABLE' : 'NOT CONFIGURED'
  const quoteByMood: Record<TsunMood, string> = {
    NORMAL: 'A number without a source is just fan fiction.',
    ANNOYED: 'Do not ask me to guess. I have standards.',
    ANGRY: 'The data layer is not your improv prompt.',
    FURIOUS: 'Someone explain risk to the timeline immediately.',
    SMUG: 'Maybe the market finally developed taste.',
    EMBARRASSED: 'Stop staring at my PnL.',
    FLUSTERED: 'I was not waiting for you to open the terminal.',
    HAPPY: 'Fine. That was almost competent.',
    PANICKING: 'Nobody touch anything. I am recalculating.',
    DERE: 'I kept the terminal warm. Not for you specifically.',
  }

  return (
    <div className="terminal-view app-scroll">
      <div className="terminal-token-header">
        <div className="terminal-identity">
          <div className="token-mark"><img src="/tsun_portrait.jpe" alt="TSUN portrait" /></div>
          <div>
            <span className="eyebrow">PRIMARY PAIR</span>
            <h1>{token.pairLabel ?? 'TSUN / SOL'}</h1>
            <div className="terminal-price-row"><strong>{tokenReady ? formatCurrency(token.priceUsd, { digits: 7 }) : pendingTokenValue}</strong><span className="token-pending-dot">{tokenReady ? `${formatPercent(token.change24h)} 24H` : token.address ? 'TOKEN FEED UNAVAILABLE' : 'TOKEN DATA PENDING'}</span></div>
          </div>
        </div>
        <div className="terminal-actions">
          <button type="button" className="system-button ghost" onClick={onOpenChat}>ASK TSUN</button>
          {token.dexUrl ? <a className="system-button ghost" href={token.dexUrl} target="_blank" rel="noreferrer">VIEW PAIR <ExternalLink size={13} /></a> : <button type="button" className="system-button disabled" disabled title="Set VITE_TSUN_TOKEN_ADDRESS to activate verified token data">TOKEN DATA PENDING</button>}
        </div>
      </div>

      <div className="terminal-metrics-grid">
        <Metric label="MARKET CAP" value={token.marketCap !== null ? formatCurrency(token.marketCap, { compact: true }) : pendingTokenValue} pending={token.marketCap === null} />
        <Metric label="24H VOLUME" value={token.volume24h !== null ? formatCurrency(token.volume24h, { compact: true }) : pendingTokenValue} pending={token.volume24h === null} />
        <Metric label="LIQUIDITY" value={token.liquidityUsd !== null ? formatCurrency(token.liquidityUsd, { compact: true }) : pendingTokenValue} pending={token.liquidityUsd === null} />
        <Metric label="HOLDERS" value="PROVIDER REQUIRED" pending />
      </div>

      <div className="terminal-main-grid">
        <SolChart market={market} />
        <aside className="terminal-commentary">
          <Avatar mood={mood} compact imagePath="/tsun_annoyed.jpe" />
          <div className="commentary-heading"><span className="eyebrow">TSUN STATUS</span><strong>{mood}</strong></div>
          <p>"{quoteByMood[mood]}"</p>
          <button type="button" className="text-action" onClick={onOpenChat}>Open conversation <ExternalLink size={13} /></button>
        </aside>
      </div>

      {/* Mobile-only extra — floor monitor + now playing + disclaimer, TSUN lore, not Stratton copy */}
      <div className="terminal-mobile-extra">
        <div className="terminal-mobile-card">
          <strong>TSUN 98 // FLOOR 4 — SHIBUYA</strong>
          <span>CAM 04 · TRADING FLOOR 4 — Daily quota $0 / $250k — 12 brokers 0 on lines</span>
          <div className="monitor-actions" style={{ marginTop: '8px' }}>
            <button type="button">📣 Motivate</button>
            <button type="button">👮 Drill</button>
            <button type="button">🍕 Lunch</button>
          </div>
          <p style={{ marginTop: '8px', color: '#8a8a86', lineHeight: '1.4' }}>TSUN's desk, not Stratton's. Same hustle vibe, different attitude. TSUN verifies before flexing.</p>
        </div>
        <div className="terminal-mobile-card">
          <strong>NOW PLAYING — TSUN_MIX_98.MP3</strong>
          <span>WAITING FOR THE OPENING BELL... — Audio device: not connected. There is no soundtrack. Focus.</span>
        </div>
        <div className="terminal-mobile-card">
          <strong>A note about all this — TSUN lore</strong>
          <span>Parody fan project. TSUN is fictional 24yo adult AI, ex-Wall-Street HFT, fired for attitude mismatch, now on Crypto X. Token TSUN on Solana. Portfolio SIMULATED MVP. Only SOL/BTC verified. Not financial advice. Inspired by Stratton's OS concept but built with TSUN's own world.</span>
        </div>
      </div>

      <div className="terminal-bottom-grid">
        <section className="market-pulse-card">
          <div className="section-heading"><div><span className="eyebrow">LIVE MARKET PULSE</span><h2>Verified context</h2></div><button type="button" className="icon-action" onClick={onRefresh} aria-label="Refresh market data"><RefreshCw size={15} /></button></div>
          <div className="asset-ribbon">
            {(['bitcoin', 'solana'] as const).map((key) => {
              const asset = market.assets[key]
              return <div className="ribbon-asset" key={key}><span>{key === 'bitcoin' ? 'BTC' : 'SOL'}</span><strong>{asset ? formatCurrency(asset.priceUsd) : 'UNAVAILABLE'}</strong><em className={asset && asset.change24h >= 0 ? 'positive' : 'negative'}>{asset ? formatPercent(asset.change24h) : 'NO SOURCE'}</em></div>
            })}
            <div className="ribbon-asset token-placeholder"><span>TSUN</span><strong>{tokenReady ? formatCurrency(token.priceUsd, { digits: 7 }) : pendingTokenValue}</strong><em className={token.change24h !== null && token.change24h >= 0 ? 'positive' : 'negative'}>{tokenReady ? formatPercent(token.change24h) : token.address ? 'FEED UNAVAILABLE' : 'TOKEN SOURCE PENDING'}</em></div>
          </div>
        </section>
        <section className="data-status-card">
          <div className="data-status-head"><span className={cn('status-dot', market.status)} /><span className="eyebrow">DATA STATUS</span></div>
          <strong>{market.status === 'live' ? 'MARKET LINK LIVE' : market.status === 'loading' ? 'CHECKING FEED' : 'MARKET LINK UNAVAILABLE'}</strong>
          <p>{market.status === 'live' ? `${market.source} updated ${freshness}.` : 'No cached price is shown as current. Refresh when the provider returns.'}</p>
          <div className="status-card-footer"><ShieldCheck size={14} /> <span>Fact layer separated from commentary</span></div>
          {market.error && <div className="inline-error"><CircleAlert size={14} /> {market.error}</div>}
        </section>
      </div>
    </div>
  )
}
