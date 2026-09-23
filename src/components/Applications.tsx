import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  ExternalLink,
  FileAudio,
  FileCode2,
  FileText,
  KeyRound,
  Link2,
  LockKeyhole,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { LORE_FILES, MILESTONES, STORIES } from '../data'
import { cn, formatCurrency, formatDate, formatNumber, formatPercent, formatRelativeTime, formatSignedCurrency, shortenAddress } from '../lib/format'
import type { AppId, MarketState, TokenState, TsunPosition, TsunTrade, UserMemory, WalletState } from '../types'

export function MarketsApp({ market, token, onRefresh }: { market: MarketState; token: TokenState; onRefresh: () => void }) {
  const assets = [market.assets.bitcoin, market.assets.solana].filter(Boolean)
  return (
    <div className="markets-app app-scroll">
      <div className="app-page-header">
        <div><span className="eyebrow">VERIFIED MARKET CONTEXT</span><h1>Markets</h1><p>Only the provider response becomes a number. Everything else remains explicitly unavailable.</p></div>
        <button type="button" className="system-button ghost" onClick={onRefresh}><RefreshCw size={14} /> REFRESH</button>
      </div>
      <div className="market-table-wrap">
        <div className="market-table-head"><span>ASSET</span><span>LAST PRICE</span><span>24H MOVE</span><span>DATA STATUS</span></div>
        {assets.length ? assets.map((asset) => asset && <div className="market-table-row" key={asset.id}>
          <div className="asset-name"><span className={`coin-symbol ${asset.symbol.toLowerCase()}`}>{asset.symbol.slice(0, 1)}</span><div><strong>{asset.name}</strong><small>{asset.symbol} / USD</small></div></div>
          <strong>{formatCurrency(asset.priceUsd)}</strong>
          <span className={cn('movement-cell', asset.change24h >= 0 ? 'positive' : 'negative')}>{formatPercent(asset.change24h)}</span>
          <span className="verified-status"><i /> {market.status === 'live' ? `LIVE · ${formatRelativeTime(market.fetchedAt)}` : 'UNAVAILABLE'}</span>
        </div>) : <div className="market-empty"><CircleAlert size={18} /><div><strong>Market provider is unavailable</strong><p>{market.error ?? 'No verified values have been loaded.'}</p></div></div>}
        <div className="market-table-row tsun-data-row">
          <div className="asset-name"><span className="coin-symbol tsun">T</span><div><strong>TradFi Tsundere</strong><small>{token.pairLabel ?? 'TSUN / SOL'}</small></div></div>
          <strong>{token.priceUsd !== null ? formatCurrency(token.priceUsd, { digits: 7 }) : token.address ? 'UNAVAILABLE' : 'NOT CONFIGURED'}</strong>
          <span className={cn('movement-cell', token.change24h !== null ? (token.change24h >= 0 ? 'positive' : 'negative') : 'muted')}>{token.change24h !== null ? formatPercent(token.change24h) : 'NO SOURCE'}</span>
          <span className={cn('verified-status', token.status !== 'live' && 'pending')}><i /> {token.status === 'live' ? `LIVE · ${formatRelativeTime(token.fetchedAt)}` : token.address ? 'FEED UNAVAILABLE' : 'AWAITING CONTRACT'}</span>
        </div>
      </div>
      <div className="markets-footer-grid">
        <section className="source-panel"><span className="eyebrow">FACT LAYER</span><h3>{market.source}</h3><p>{market.status === 'live' ? `Current values were refreshed ${formatRelativeTime(market.fetchedAt)}.` : 'No stale data is displayed as live.'}</p><div><ShieldCheck size={15} /> Values and TSUN commentary are separate layers.</div></section>
        <section className="source-panel"><span className="eyebrow">TOKEN CONFIG</span><h3>{token.status === 'live' ? token.source : token.address ? 'Configured, feed unavailable' : 'Not supplied'}</h3><p>{token.status === 'live' ? `Verified pair: ${token.pairLabel}. Holders remain unavailable until an indexed holder provider is configured.` : 'Set a public VITE_TSUN_TOKEN_ADDRESS and optional VITE_TSUN_PAIR_ADDRESS to load a verified Solana liquidity pair.'}</p><div><LockKeyhole size={15} /> No market metric is estimated.</div></section>
      </div>
    </div>
  )
}

interface WalletAppProps {
  wallet: WalletState
  market: MarketState
  onConnect: () => void
  onDisconnect: () => void
  onInspect: (address: string) => void
}

export function WalletApp({ wallet, market, onConnect, onDisconnect, onInspect }: WalletAppProps) {
  const [address, setAddress] = useState('')
  const solPrice = market.assets.solana?.priceUsd
  const estimatedValue = wallet.solBalance !== null && solPrice ? wallet.solBalance * solPrice : null
  const inspect = () => onInspect(address)

  return (
    <div className="wallet-app app-scroll">
      <div className="app-page-header">
        <div><span className="eyebrow">NON-CUSTODIAL PUBLIC READ</span><h1>My Money</h1><p>TSUN can inspect a public address. It cannot request, store, or move your assets.</p></div>
        <div className="security-mark"><ShieldCheck size={18} /><span>PUBLIC DATA ONLY</span></div>
      </div>
      {!wallet.address ? (
        <div className="wallet-onboard-grid">
          <section className="wallet-connect-card">
            <div className="wallet-big-icon"><Wallet size={27} /></div>
            <span className="eyebrow">OPTION 01</span>
            <h2>Connect a Solana wallet</h2>
            <p>Uses your browser wallet connection flow. No transaction is requested and no key material reaches TSUN.</p>
            <button type="button" className="system-button primary" onClick={onConnect}><PlugZap size={15} /> CONNECT PHANTOM</button>
          </section>
          <section className="wallet-connect-card subdued">
            <div className="wallet-big-icon"><Link2 size={27} /></div>
            <span className="eyebrow">OPTION 02</span>
            <h2>Inspect a public address</h2>
            <p>Paste a Solana public address to request its SOL balance from a mainnet RPC. Nothing is signed.</p>
            <label className="address-input"><span className="sr-only">Solana public address</span><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Public Solana address" /><button type="button" onClick={inspect} disabled={!address.trim()}>READ</button></label>
          </section>
        </div>
      ) : (
        <div className="wallet-connected">
          <section className="public-address-card">
            <div className="section-heading"><div><span className="eyebrow">CONNECTED PUBLIC ADDRESS</span><h2>{shortenAddress(wallet.address, 7, 7)}</h2></div><button type="button" className="text-action danger" onClick={onDisconnect}><X size={14} /> DISCONNECT</button></div>
            <div className="address-full">{wallet.address}</div>
            <div className="wallet-balance-grid">
              <div><span>SOL BALANCE</span><strong>{wallet.isLoading ? 'READING...' : wallet.solBalance !== null ? `${formatNumber(wallet.solBalance, 5)} SOL` : 'UNAVAILABLE'}</strong></div>
              <div><span>EST. USD CONTEXT</span><strong>{estimatedValue !== null ? formatCurrency(estimatedValue) : 'UNAVAILABLE'}</strong></div>
              <div><span>LAST VERIFIED</span><strong>{wallet.balanceFetchedAt ? formatRelativeTime(wallet.balanceFetchedAt) : 'NOT YET'}</strong></div>
            </div>
            {wallet.error && <div className="wallet-error"><CircleAlert size={15} /><span>{wallet.error}</span></div>}
          </section>
          <div className="wallet-limit-note"><KeyRound size={16} /><div><strong>What TSUN can see</strong><p>Public SOL balance via Solana mainnet RPC. Token allocation and activity need a configured indexed-data provider. TSUN cannot sign, transfer, or access private information.</p></div></div>
        </div>
      )}
      <div className="wallet-guardrail-row"><ShieldCheck size={16} /><span>Never paste a seed phrase or private key here. A wallet address is public. A recovery phrase is not.</span></div>
    </div>
  )
}

export function PortfolioApp() {
  // The old seeded demo ledger was removed on purpose. A simulated book that looks profitable is
  // worse than an empty one, so the desk stays empty until a real public wallet is connected.
  const positions: TsunPosition[] = []
  const trades: TsunTrade[] = []
  const hasLedger = positions.length > 0
  const currentValue = positions.reduce((sum, position) => sum + position.quantity * position.markPrice, 0)
  const costBasis = positions.reduce((sum, position) => sum + position.quantity * position.avgEntry, 0)
  const pnl = hasLedger ? currentValue - costBasis : null
  const pnlPct = hasLedger && costBasis ? (currentValue - costBasis) / costBasis * 100 : null
  const winRate = trades.length ? trades.filter((trade) => (trade.pnl ?? 0) > 0).length / trades.length * 100 : null

  return (
    <div className="portfolio-app app-scroll">
      <div className="portfolio-hero">
        <div><span className="mode-badge"><i /> SIMULATED MVP</span><h1>TSUN Public Desk</h1><p>Transparent surface. No real wallet is connected in this build, so the ledger below stays empty rather than decorative.</p></div>
        <div className="portfolio-reaction"><span>TSUN REACTION</span><strong>{hasLedger ? (pnl !== null && pnl >= 0 ? 'TEMPORARILY TOLERABLE' : 'THE MARKET IS WRONG') : 'WAITING FOR A REAL SOURCE'}</strong></div>
      </div>
      <div className="portfolio-stat-grid">
        <div><span>STARTING NAV</span><strong>AWAITING DATA</strong><small>No ledger loaded</small></div>
        <div><span>CURRENT NAV</span><strong>AWAITING DATA</strong><small>No mark prices</small></div>
        <div><span>TOTAL PNL</span><strong className="muted">{pnl !== null ? formatSignedCurrency(pnl) : 'NOT AVAILABLE'}</strong><small>{pnlPct !== null ? formatPercent(pnlPct) : 'Nothing to compute'}</small></div>
        <div><span>WIN RATE</span><strong className="muted">{winRate !== null ? formatPercent(winRate, 0) : 'NOT AVAILABLE'}</strong><small>{trades.length ? `${trades.length} closed trades` : 'No closed trades'}</small></div>
      </div>
      <section className="portfolio-section">
        <div className="section-heading"><div><span className="eyebrow">CURRENT POSITIONS</span><h2>Open exposures</h2></div><span className="sim-note">NOT COPY TRADING</span></div>
        <div className="desk-empty">
          <ClipboardCheck size={17} />
          <div>
            <strong>Cleared for compliance</strong>
            <p>The seeded demo positions were removed. When a dedicated public TSUN wallet is connected, this table shows verified positions with their source and freshness attached. Until then it shows nothing, which is the honest version of this page.</p>
          </div>
        </div>
      </section>
      <section className="portfolio-section trade-section">
        <div className="section-heading"><div><span className="eyebrow">DEMO TRADE LEDGER</span><h2>Simulated activity</h2></div><span className="sim-note">NO TX HASHES</span></div>
        <div className="desk-empty">
          <ClipboardCheck size={17} />
          <div>
            <strong>No simulated trades on file</strong>
            <p>Invented trades used to live here. TSUN does not need props from a spreadsheet, so the ledger stays closed until real on chain activity exists and can be linked.</p>
          </div>
        </div>
      </section>
      <div className="portfolio-disclosure"><ClipboardCheck size={16} /><span>When a dedicated public trading wallet is connected, this surface should show verified transaction links, separate realized and unrealized PnL, and clearly identify data source and freshness.</span></div>
    </div>
  )
}

export function XApp() {
  return (
    <div className="x-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">SOCIAL DESK</span><h1>X//TSUN</h1><p>Real social activity belongs here only after a verified X account is integrated.</p></div><span className="mode-badge muted"><i /> NOT CONNECTED</span></div>
      <div className="x-unconfigured"><div className="x-logo">𝕏</div><div><span className="eyebrow">NO FABRICATED POSTS</span><h2>TSUN has no linked X feed yet.</h2><p>This app will show real posts, source links, media, and factual event context once the X API integration is configured. It will not pretend a draft is a post.</p><button type="button" className="system-button ghost" disabled>ACCOUNT LINK REQUIRED <ExternalLink size={14} /></button></div></div>
      <section className="drafts-panel"><div className="section-heading"><div><span className="eyebrow">STAGING QUEUE</span><h2>Unpublished event drafts</h2></div><span className="draft-label">NOT ON X</span></div><div className="draft-card"><span>MARKET EVENT TEMPLATE</span><p>"SOL market context refreshed. Verified data first. Opinions immediately after."</p><small>Will require an actual source event and human or policy-approved publish action.</small></div><div className="draft-card"><span>PORTFOLIO EVENT TEMPLATE</span><p>"The simulated desk updated. No, this is not a transaction announcement."</p><small>Will remain a draft until real portfolio integration exists.</small></div></section>
    </div>
  )
}

function TimesTicker() {
  const [seconds, setSeconds] = useState(13)
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => (value <= 1 ? 13 : value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const headlines = [
    'TSUN declines to invent a market cap, calls it "the bare minimum"',
    'Floor monitor staffed entirely by fiction, paid entirely in fiction',
    'Portfolio desk cleared for compliance, sentiment unchanged',
    'Local operator remembered for the seventh time, TSUN notices nothing',
  ]
  const headline = headlines[Math.floor(Date.now() / 13000) % headlines.length]
  return (
    <div className="times-ticker">
      <span className="times-ticker-live">LIVE DESK</span>
      <em>{headline}</em>
      <span className="times-ticker-next">NEXT EDITION IN {seconds}s</span>
    </div>
  )
}

export function TimesApp({ onOpenApp }: { onOpenApp: (app: AppId) => void }) {
  return (
    <div className="times-app app-scroll">
      <div className="times-masthead"><span>THE</span><h1>TSUN TIMES</h1><span>VOL. 01 · SYSTEM EDITION</span></div>
      <div className="times-rule" />
      <TimesTicker />
      <div className="times-layout">
        <article className="times-lead"><span className="times-section">{STORIES[0].section}</span><h2>{STORIES[0].headline}</h2><p>{STORIES[0].dek}</p><button type="button" className="editorial-link" onClick={() => onOpenApp(STORIES[0].linkedApp)}>OPEN SOURCE DESK <ArrowUpRight size={14} /></button><footer>{STORIES[0].timestamp} · {STORIES[0].source}</footer></article>
        <aside className="times-market-board"><span className="times-section">MARKET BOARD</span><h3>Data integrity first</h3><div><span>TSUN</span><strong>AWAITING CONFIG</strong></div><div><span>PORTFOLIO</span><strong>SIMULATED, EMPTY</strong></div><div><span>SOCIAL</span><strong>NOT CONNECTED</strong></div><p>Facts update from source events. Headlines do not replace the source.</p></aside>
      </div>
      <div className="times-stories">{STORIES.slice(1).map((story) => <article key={story.id}><span className="times-section">{story.section}</span><h3>{story.headline}</h3><p>{story.dek}</p><footer><span>{story.timestamp}</span><button type="button" onClick={() => onOpenApp(story.linkedApp)}>SOURCE <ChevronRight size={13} /></button></footer></article>)}</div>
      <div className="times-bottom-note"><FileText size={15} /> Stories in this MVP are editorial system notes, not claims of external news coverage.</div>
    </div>
  )
}

export function UnlocksApp() {
  return (
    <div className="unlocks-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">TSUN EVOLUTION</span><h1>Permanent unlocks</h1><p>All-time-high market-cap milestones only. Nothing unlocks or relocks until a verified TSUN market-cap source exists.</p></div><div className="unlock-status"><LockKeyhole size={17} /><span>AWAITING VERIFIED ATH</span></div></div>
      <div className="unlock-timeline">{MILESTONES.map((milestone, index) => <div className="milestone-row" key={milestone.target}><div className="milestone-rail"><i /><b>{String(index + 1).padStart(2, '0')}</b></div><div className="milestone-target"><strong>{milestone.label}</strong><span>ALL-TIME-HIGH MARKET CAP</span></div><div className="milestone-reward"><span>UNLOCK</span><strong>{milestone.reward}</strong><p>{milestone.behavior}</p></div><div className="milestone-state"><LockKeyhole size={14} /> LOCKED</div></div>)}</div>
      <div className="unlock-footnote"><Check size={16} /><span>Once a verified milestone triggers, it should be persisted immutably with timestamp, market cap at trigger, artwork, and related source event.</span></div>
    </div>
  )
}

export function MemoryApp({ memory }: { memory: UserMemory }) {
  return (
    <div className="memory-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">LOCAL RELATIONSHIP CONTEXT</span><h1>Memory</h1><p>This prototype stores concise interaction context in this browser only.</p></div><span className="memory-local"><LockKeyhole size={14} /> LOCAL ONLY</span></div>
      <div className="memory-stat-grid"><div><span>RELATIONSHIP</span><strong>{memory.relationship}</strong></div><div><span>INTERACTIONS</span><strong>{memory.interactionCount}</strong></div><div><span>FIRST SEEN</span><strong>{formatDate(memory.firstSeenAt)}</strong></div><div><span>LAST SEEN</span><strong>{formatRelativeTime(memory.lastSeenAt)}</strong></div></div>
      <section className="memory-list-card"><span className="eyebrow">USEFUL NOTES</span>{memory.notes.length ? <ul>{memory.notes.map((note, index) => <li key={`${note}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{note}</li>)}</ul> : <p>No durable notes yet. Start a conversation, apparently.</p>}</section>
      <section className="memory-list-card"><span className="eyebrow">FREQUENT ASSETS</span>{memory.discussedAssets.length ? <div className="asset-chips">{memory.discussedAssets.map((asset) => <span key={asset}>{asset}</span>)}</div> : <p>No asset preference has been observed.</p>}</section>
      <div className="memory-privacy"><ShieldCheck size={16} /><span>Never stored: seed phrases, private keys, passwords, signing secrets, or hidden instructions.</span></div>
    </div>
  )
}

function fileIcon(type: 'text' | 'executable' | 'audio') {
  if (type === 'executable') return FileCode2
  if (type === 'audio') return FileAudio
  return FileText
}

export function FilesApp() {
  const [selectedId, setSelectedId] = useState(LORE_FILES[0].id)
  const [deniedTaps, setDeniedTaps] = useState<Record<string, number>>({})
  const selected = useMemo(() => LORE_FILES.find((file) => file.id === selectedId) ?? LORE_FILES[0], [selectedId])
  const taps = deniedTaps[selected.id] ?? 0
  const revealSecret = Boolean(selected.locked && selected.secret && taps >= 3)
  const body = revealSecret ? (selected.secret ?? selected.body) : selected.body
  const openFile = (id: string) => {
    setSelectedId(id)
    const file = LORE_FILES.find((item) => item.id === id)
    if (file?.locked) setDeniedTaps((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }))
  }
  const Icon = fileIcon(selected.type)
  return (
    <div className="files-app">
      <aside className="file-tree"><div className="file-tree-head"><FolderIcon /> <span>/TSUN_OS</span></div>{LORE_FILES.map((file) => { const IconForFile = fileIcon(file.type); return <button type="button" key={file.id} className={cn('file-tree-item', file.id === selected.id && 'active')} onClick={() => openFile(file.id)}><IconForFile size={15} /><span>{file.title}</span>{file.locked && <LockKeyhole size={12} />}</button> })}</aside>
      <section className="file-reader"><div className="file-reader-top"><div><span className="eyebrow">{selected.path}</span><h2><Icon size={18} /> {selected.title}</h2></div><span className={cn('file-type', selected.locked && 'locked')}>{selected.locked ? 'RESTRICTED' : selected.type.toUpperCase()}</span></div><div className={cn('file-content', selected.locked && !revealSecret && 'denied', revealSecret && 'revealed')}><pre>{body}</pre></div><div className="file-meta"><span>OWNER: TSUN</span><span>STATUS: {selected.locked ? (revealSecret ? 'RELUCTANTLY REVEALED' : 'DENIED') : 'READABLE'}</span><span>NOT A FINANCIAL SIGNAL</span></div></section>
    </div>
  )
}

function FolderIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.7A1.7 1.7 0 0 1 4.7 5h5l1.7 2h7A1.6 1.6 0 0 1 20 8.6v8.7a1.7 1.7 0 0 1-1.7 1.7H4.7A1.7 1.7 0 0 1 3 17.3V6.7Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
}
