import {
  ChevronDown,
  Grid2X2,
  Menu,
  MonitorUp,
  Power,
  Volume2,
  VolumeX,
  WalletCards,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { APP_DEFINITIONS } from './data'
import { useClock, useLocalStorage, useMediaQuery } from './hooks'
import { fetchMarketState, fetchSolChart } from './lib/market'
import { fetchTokenState, initialTokenState } from './lib/token'
import { cn, formatCurrency, formatPercent, shortenAddress, uniqueId } from './lib/format'
import { createInitialMemory, initialMessages, relationshipFromInteractions, respondAsTsun } from './lib/tsun'
import { disconnectPhantomWallet, fetchSolBalance, requestPhantomConnection } from './lib/wallet'
import type { AppId, ChatMessage, DesktopWindow, MarketState, Toast, TokenState, TsunMood, UserMemory, WalletState } from './types'
import { BootScreen } from './components/BootScreen'
import { WindowFrame } from './components/WindowFrame'
import { Terminal } from './components/Terminal'
import { Chat } from './components/Chat'
import { FilesApp, MarketsApp, MemoryApp, PortfolioApp, TimesApp, UnlocksApp, WalletApp, XApp } from './components/Applications'

const APP_BY_ID = Object.fromEntries(APP_DEFINITIONS.map((app) => [app.id, app])) as Record<AppId, (typeof APP_DEFINITIONS)[number]>

const DEFAULT_WINDOW_LAYOUT: Record<AppId, Omit<DesktopWindow, 'open' | 'minimized' | 'zIndex'>> = {
  terminal: { id: 'terminal', x: 220, y: 74, width: 940, height: 690, maximized: false },
  chat: { id: 'chat', x: 268, y: 90, width: 890, height: 640, maximized: false },
  markets: { id: 'markets', x: 245, y: 90, width: 855, height: 625, maximized: false },
  wallet: { id: 'wallet', x: 300, y: 102, width: 790, height: 580, maximized: false },
  portfolio: { id: 'portfolio', x: 230, y: 82, width: 925, height: 655, maximized: false },
  x: { id: 'x', x: 312, y: 104, width: 745, height: 560, maximized: false },
  times: { id: 'times', x: 252, y: 78, width: 885, height: 630, maximized: false },
  unlocks: { id: 'unlocks', x: 278, y: 84, width: 820, height: 642, maximized: false },
  memory: { id: 'memory', x: 316, y: 100, width: 735, height: 555, maximized: false },
  files: { id: 'files', x: 290, y: 94, width: 805, height: 575, maximized: false },
}

function createWindows(): Record<AppId, DesktopWindow> {
  return APP_DEFINITIONS.reduce((windows, app, index) => {
    windows[app.id] = {
      ...DEFAULT_WINDOW_LAYOUT[app.id],
      open: app.id === 'terminal',
      minimized: false,
      zIndex: app.id === 'terminal' ? 20 : index + 1,
    }
    return windows
  }, {} as Record<AppId, DesktopWindow>)
}

const initialMarket: MarketState = {
  status: 'loading',
  source: 'CoinGecko',
  fetchedAt: null,
  error: null,
  assets: {},
  chartPrices: [],
  chartFetchedAt: null,
}

const initialToken: TokenState = initialTokenState()

const initialWallet: WalletState = {
  address: null,
  solBalance: null,
  balanceFetchedAt: null,
  error: null,
  isLoading: false,
  mode: 'idle',
}

function App() {
  const isMobile = useMediaQuery('(max-width: 820px)')
  const clock = useClock()
  const [hasBootedBefore, setHasBootedBefore] = useLocalStorage('tsun-os-booted', false)
  const [bootComplete, setBootComplete] = useState(false)
  const [market, setMarket] = useState<MarketState>(initialMarket)
  const [token, setToken] = useState<TokenState>(initialToken)
  const [wallet, setWallet] = useState<WalletState>(initialWallet)
  const [memory, setMemory] = useLocalStorage<UserMemory>('tsun-os-memory', createInitialMemory())
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('tsun-os-messages', initialMessages())
  const [mood, setMood] = useState<TsunMood>('ANNOYED')
  const [windows, setWindows] = useState<Record<AppId, DesktopWindow>>(createWindows)
  const [mobileApp, setMobileApp] = useState<AppId>('terminal')
  const [launcherOpen, setLauncherOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [soundMuted, setSoundMuted] = useState(true)
  const returnedToastShown = useRef(false)

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = uniqueId('toast')
    setToasts((current) => [...current.slice(-3), { ...toast, id }])
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 6000)
  }, [])

  const refreshMarket = useCallback(async () => {
    setMarket((current) => ({ ...current, status: 'loading', error: null }))
    setToken((current) => current.address ? { ...current, status: 'loading', error: null } : current)
    const [marketResult, chartResult, tokenResult] = await Promise.all([fetchMarketState(), fetchSolChart(), fetchTokenState()])
    setMarket((current) => ({
      ...current,
      ...marketResult,
      chartPrices: chartResult.chartPrices,
      chartFetchedAt: chartResult.chartFetchedAt,
    }))
    setToken(tokenResult)
  }, [])

  useEffect(() => {
    void refreshMarket()
    const interval = window.setInterval(() => void refreshMarket(), 60_000)
    return () => window.clearInterval(interval)
  }, [refreshMarket])

  const finishBoot = useCallback(() => {
    setHasBootedBefore(true)
    setBootComplete(true)
  }, [setHasBootedBefore])

  useEffect(() => {
    if (!bootComplete || memory.interactionCount === 0 || returnedToastShown.current) return
    returnedToastShown.current = true
    addToast({
      title: 'TSUN//SYSTEM',
      body: 'Welcome back. Your local context has been restored. Do not make it sentimental.',
      kind: 'system',
    })
  }, [addToast, bootComplete, memory.interactionCount])

  const openApp = useCallback((id: AppId) => {
    if (isMobile) {
      setMobileApp(id)
      setMoreOpen(false)
      setLauncherOpen(false)
      return
    }
    setWindows((current) => {
      const zIndex = Math.max(...Object.values(current).map((window) => window.zIndex), 10) + 1
      return { ...current, [id]: { ...current[id], open: true, minimized: false, zIndex } }
    })
    setLauncherOpen(false)
  }, [isMobile])

  const focusWindow = useCallback((id: AppId) => {
    setWindows((current) => {
      const zIndex = Math.max(...Object.values(current).map((window) => window.zIndex), 10) + 1
      return { ...current, [id]: { ...current[id], zIndex } }
    })
  }, [])

  const closeWindow = useCallback((id: AppId) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], open: false, minimized: false } }))
  }, [])

  const minimizeWindow = useCallback((id: AppId) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], minimized: true } }))
  }, [])

  const maximizeWindow = useCallback((id: AppId) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], maximized: !current[id].maximized } }))
  }, [])

  const moveWindow = useCallback((id: AppId, x: number, y: number) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], x, y } }))
  }, [])

  const handleConnectWallet = useCallback(async () => {
    try {
      setWallet((current) => ({ ...current, isLoading: true, error: null }))
      const address = await requestPhantomConnection()
      setWallet({ address, solBalance: null, balanceFetchedAt: null, error: null, isLoading: true, mode: 'connected' })
      try {
        const solBalance = await fetchSolBalance(address)
        setWallet({ address, solBalance, balanceFetchedAt: new Date().toISOString(), error: null, isLoading: false, mode: 'connected' })
        addToast({ title: 'WALLET CONNECTED', body: 'Public balance loaded. TSUN cannot access or move your assets.', kind: 'secure' })
      } catch (error) {
        setWallet({ address, solBalance: null, balanceFetchedAt: null, error: error instanceof Error ? error.message : 'Unable to read public balance', isLoading: false, mode: 'connected' })
      }
    } catch (error) {
      setWallet((current) => ({ ...current, isLoading: false, error: error instanceof Error ? error.message : 'Wallet connection failed' }))
      addToast({ title: 'WALLET CONNECTION', body: error instanceof Error ? error.message : 'Wallet connection failed.', kind: 'secure' })
    }
  }, [addToast])

  const handleInspectAddress = useCallback(async (address: string) => {
    const normalized = address.trim()
    setWallet({ address: normalized, solBalance: null, balanceFetchedAt: null, error: null, isLoading: true, mode: 'inspecting' })
    try {
      const solBalance = await fetchSolBalance(normalized)
      setWallet({ address: normalized, solBalance, balanceFetchedAt: new Date().toISOString(), error: null, isLoading: false, mode: 'inspecting' })
      addToast({ title: 'PUBLIC ADDRESS LOADED', body: 'Only a public SOL balance was read from the Solana RPC.', kind: 'secure' })
    } catch (error) {
      setWallet({ address: normalized, solBalance: null, balanceFetchedAt: null, error: error instanceof Error ? error.message : 'Unable to inspect address', isLoading: false, mode: 'inspecting' })
    }
  }, [addToast])

  const handleDisconnectWallet = useCallback(async () => {
    try {
      await disconnectPhantomWallet()
    } catch {
      // Disconnection is best effort. Local public context is cleared either way.
    }
    setWallet(initialWallet)
    addToast({ title: 'WALLET DISCONNECTED', body: 'Public wallet context was removed from this session.', kind: 'secure' })
  }, [addToast])

  const handleSend = useCallback((body: string) => {
    if (sending || !body.trim()) return
    const userMessage: ChatMessage = { id: uniqueId('user'), role: 'user', body: body.trim(), createdAt: new Date().toISOString() }
    setMessages((current) => [...current, userMessage])
    setSending(true)

    window.setTimeout(() => {
      const reply = respondAsTsun({ prompt: body, memory, market, token, wallet })
      const tsunMessage: ChatMessage = {
        id: uniqueId('tsun'),
        role: 'tsun',
        body: reply.body,
        mood: reply.mood,
        toolCard: reply.toolCard,
        createdAt: new Date().toISOString(),
      }
      setMessages((current) => [...current, tsunMessage])
      if (mood !== reply.mood) {
        addToast({ title: 'TSUN MOOD CHANGED', body: `${mood} → ${reply.mood}`, kind: 'mood' })
      }
      setMood(reply.mood)
      setMemory((current) => {
        const nextCount = current.interactionCount + 1
        const discussed = [...current.discussedAssets]
        const lower = body.toLowerCase()
        if (lower.includes('sol') && !discussed.includes('SOL')) discussed.push('SOL')
        if ((lower.includes('btc') || lower.includes('bitcoin')) && !discussed.includes('BTC')) discussed.push('BTC')
        if (lower.includes('tsun') && !discussed.includes('TSUN')) discussed.push('TSUN')
        const notes = [...current.notes]
        reply.memoryNotes?.forEach((note) => {
          if (!notes.includes(note)) notes.unshift(note)
        })
        return {
          ...current,
          interactionCount: nextCount,
          relationship: relationshipFromInteractions(nextCount),
          lastSeenAt: new Date().toISOString(),
          discussedAssets: discussed.slice(0, 6),
          notes: notes.slice(0, 8),
        }
      })
      setSending(false)
    }, 500)
  }, [addToast, market, memory, mood, sending, setMemory, setMessages, token, wallet])

  const appContent = useCallback((id: AppId) => {
    switch (id) {
      case 'terminal': return <Terminal market={market} token={token} mood={mood} onRefresh={() => void refreshMarket()} onOpenChat={() => openApp('chat')} />
      case 'chat': return <Chat messages={messages} mood={mood} memory={memory} sending={sending} onSend={handleSend} />
      case 'markets': return <MarketsApp market={market} token={token} onRefresh={() => void refreshMarket()} />
      case 'wallet': return <WalletApp wallet={wallet} market={market} onConnect={() => void handleConnectWallet()} onDisconnect={() => void handleDisconnectWallet()} onInspect={(address) => void handleInspectAddress(address)} />
      case 'portfolio': return <PortfolioApp />
      case 'x': return <XApp />
      case 'times': return <TimesApp onOpenApp={openApp} />
      case 'unlocks': return <UnlocksApp />
      case 'memory': return <MemoryApp memory={memory} />
      case 'files': return <FilesApp />
      default: return null
    }
  }, [handleConnectWallet, handleDisconnectWallet, handleInspectAddress, handleSend, market, memory, messages, mood, openApp, refreshMarket, sending, token, wallet])

  const activeWindowApps = useMemo(() => APP_DEFINITIONS.filter((app) => windows[app.id].open), [windows])
  const primaryDesktopIcons: AppId[] = ['terminal', 'chat', 'wallet', 'portfolio', 'times', 'files', 'unlocks', 'x']
  const sol = market.assets.solana

  if (!bootComplete) {
    return <BootScreen mood={mood} relationship={memory.relationship} marketStatus={market.status} returning={hasBootedBefore} onComplete={finishBoot} />
  }

  return (
    <main className={cn('tsun-os', `mood-${mood.toLowerCase()}`)}>
      <div className="desktop-texture" />
      <header className="global-bar">
        <button type="button" className="brand-lockup" onClick={() => openApp('terminal')} aria-label="Open TSUN terminal"><span className="brand-caret">&gt;_</span><span>TSUN//OS</span></button>
        <div className="global-ticker">
          <button type="button" onClick={() => openApp('terminal')} className="ticker-chip tsun-ticker"><span>TSUN</span><strong>{token.priceUsd !== null ? formatCurrency(token.priceUsd, { digits: 7 }) : token.address ? 'FEED UNAVAILABLE' : 'AWAITING CONFIG'}</strong>{token.change24h !== null && <em className={token.change24h >= 0 ? 'positive' : 'negative'}>{formatPercent(token.change24h)}</em>}</button>
          <button type="button" onClick={() => openApp('markets')} className="ticker-chip"><span>SOL</span><strong>{sol ? formatCurrency(sol.priceUsd) : 'UNAVAILABLE'}</strong>{sol && <em className={sol.change24h >= 0 ? 'positive' : 'negative'}>{formatPercent(sol.change24h)}</em>}</button>
          <span className="market-open"><i /> MARKET CONTEXT</span>
        </div>
        <div className="global-actions">
          <button type="button" className="global-live" onClick={() => openApp('markets')} title="Open data status"><span className={cn('status-dot', market.status)} /> {market.status === 'live' ? 'LIVE' : market.status === 'loading' ? 'SYNCING' : 'OFFLINE'}</button>
          <button type="button" className="wallet-top-button" onClick={() => openApp('wallet')}><WalletCards size={14} /><span>{wallet.address ? shortenAddress(wallet.address) : 'CONNECT'}</span></button>
          <button type="button" className="icon-action top-icon" onClick={() => setSoundMuted((value) => !value)} aria-label={soundMuted ? 'Enable sound hooks' : 'Mute sound hooks'}>{soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
          <button type="button" className="icon-action top-icon mobile-menu-trigger" onClick={() => setMoreOpen((value) => !value)} aria-label="Open more applications"><Menu size={17} /></button>
        </div>
      </header>

      {isMobile ? (
        <section className="mobile-workspace">{appContent(mobileApp)}</section>
      ) : (
        <section className="desktop-workspace">
          <div className="desktop-icons" aria-label="TSUN OS applications">
            {primaryDesktopIcons.map((id) => {
              const app = APP_BY_ID[id]
              const Icon = app.icon
              return <button type="button" className="desktop-icon" key={id} onClick={() => openApp(id)}><span><Icon size={23} /></span><small>{app.shortTitle}</small></button>
            })}
          </div>
          {APP_DEFINITIONS.map((app) => {
            const windowState = windows[app.id]
            if (!windowState.open || windowState.minimized) return null
            return <WindowFrame
              key={app.id}
              definition={app}
              windowState={windowState}
              onFocus={() => focusWindow(app.id)}
              onClose={() => closeWindow(app.id)}
              onMinimize={() => minimizeWindow(app.id)}
              onMaximize={() => maximizeWindow(app.id)}
              onMove={(x, y) => moveWindow(app.id, x, y)}
              live={app.id === 'terminal' || app.id === 'markets'}
            >{appContent(app.id)}</WindowFrame>
          })}
          {activeWindowApps.length === 0 && <div className="desktop-empty"><MonitorUp size={29} /><strong>NO APPLICATIONS OPEN</strong><span>Open a system app from the dock or desktop.</span></div>}
        </section>
      )}

      {launcherOpen && !isMobile && <AppLauncher onOpen={openApp} onClose={() => setLauncherOpen(false)} />}
      {moreOpen && <MoreDrawer onOpen={openApp} onClose={() => setMoreOpen(false)} />}

      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => <article className={cn('toast', `toast-${toast.kind}`)} key={toast.id}><button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} aria-label="Dismiss notification"><X size={13} /></button><span className="toast-kicker">{toast.title}</span><p>{toast.body}</p></article>)}
      </div>

      {isMobile ? <MobileNav active={mobileApp} onOpen={openApp} onMore={() => setMoreOpen((value) => !value)} /> : <Taskbar activeApps={activeWindowApps.map((app) => app.id)} windows={windows} onOpen={openApp} onToggleLauncher={() => setLauncherOpen((value) => !value)} currentTime={clock} />}
    </main>
  )
}

function Taskbar({ activeApps, windows, onOpen, onToggleLauncher, currentTime }: { activeApps: AppId[]; windows: Record<AppId, DesktopWindow>; onOpen: (id: AppId) => void; onToggleLauncher: () => void; currentTime: Date }) {
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(currentTime)
  return (
    <footer className="taskbar">
      <button type="button" className="taskbar-start" onClick={onToggleLauncher}><Grid2X2 size={16} /><span>APPS</span></button>
      <div className="taskbar-apps">{activeApps.map((id) => { const app = APP_BY_ID[id]; const Icon = app.icon; return <button type="button" key={id} className={cn('taskbar-app', windows[id].minimized && 'minimized')} onClick={() => onOpen(id)}><Icon size={14} /><span>{app.shortTitle}</span></button> })}</div>
      <div className="taskbar-status"><span className="taskbar-status-label">LOCAL SESSION</span><span>{time} UTC</span><button type="button" className="power-button" title="Session is browser local only"><Power size={14} /></button></div>
    </footer>
  )
}

function AppLauncher({ onOpen, onClose }: { onOpen: (id: AppId) => void; onClose: () => void }) {
  return (
    <aside className="app-launcher">
      <div className="launcher-header"><div><span className="eyebrow">TSUN//OS</span><h2>Applications</h2></div><button type="button" onClick={onClose}><X size={16} /></button></div>
      <div className="launcher-grid">{APP_DEFINITIONS.map((app) => { const Icon = app.icon; return <button type="button" key={app.id} onClick={() => onOpen(app.id)}><Icon size={20} /><strong>{app.shortTitle}</strong><span>{app.description}</span></button> })}</div>
    </aside>
  )
}

function MoreDrawer({ onOpen, onClose }: { onOpen: (id: AppId) => void; onClose: () => void }) {
  const moreApps: AppId[] = ['wallet', 'portfolio', 'x', 'times', 'unlocks', 'files', 'memory']
  return (
    <aside className="more-drawer">
      <div className="more-drawer-header"><div><span className="eyebrow">TSUN//OS</span><h2>More applications</h2></div><button type="button" onClick={onClose}><X size={17} /></button></div>
      <div className="more-app-list">{moreApps.map((id) => { const app = APP_BY_ID[id]; const Icon = app.icon; return <button type="button" key={id} onClick={() => onOpen(id)}><Icon size={18} /><span><strong>{app.shortTitle}</strong><small>{app.description}</small></span><ChevronDown size={15} /></button> })}</div>
    </aside>
  )
}

function MobileNav({ active, onOpen, onMore }: { active: AppId; onOpen: (id: AppId) => void; onMore: () => void }) {
  const nav: AppId[] = ['terminal', 'chat', 'markets', 'portfolio']
  return (
    <footer className="mobile-nav">{nav.map((id) => { const app = APP_BY_ID[id]; const Icon = app.icon; return <button type="button" className={cn(active === id && 'active')} key={id} onClick={() => onOpen(id)}><Icon size={18} /><span>{id === 'portfolio' ? 'Desk' : app.shortTitle}</span></button> })}<button type="button" className={cn(!nav.includes(active) && 'active')} onClick={onMore}><Menu size={18} /><span>More</span></button></footer>
  )
}

export default App
