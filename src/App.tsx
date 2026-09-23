import {
  ChevronDown,
  Grid2X2,
  Menu,
  MonitorUp,
  Power,
  Search,
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
import { createInitialMemory, initialMessages, relationshipFromInteractions } from './lib/tsun'
import { disconnectPhantomWallet, fetchSolBalance, requestPhantomConnection } from './lib/wallet'
import { requestTsunReply } from './lib/chatService'
import type { AppId, ChatMessage, DesktopWindow, MarketState, Toast, TokenState, TsunMood, UserMemory, WalletState } from './types'
import { BootScreen } from './components/BootScreen'
import { WindowFrame } from './components/WindowFrame'
import { Terminal } from './components/Terminal'
import { Chat } from './components/Chat'
import { FilesApp, MarketsApp, MemoryApp, PortfolioApp, TimesApp, UnlocksApp, WalletApp, XApp } from './components/Applications'
import { CRTOverlay } from './components/CRTOverlay'
import { NowPlaying } from './components/NowPlaying'
import { ShutdownScreen } from './components/ShutdownScreen'
import { TickerTape } from './components/TickerTape'
import { MediaPlayerApp, PhoneDialerApp, FerrariApp, MailApp, GameApp, RecycleApp, FaxApp, AboutApp, HowItWorksApp } from './components/FunApps'

const APP_BY_ID = Object.fromEntries(APP_DEFINITIONS.map((app) => [app.id, app])) as Record<AppId, (typeof APP_DEFINITIONS)[number]>
const DESKTOP_ICON_ASSETS: Partial<Record<AppId, string>> = {
  terminal: '/98-icons/msdos-32x32.png',
  chat: '/98-icons/notepad-32x32.png',
  markets: '/98-icons/paint-32x32.png',
  wallet: '/98-icons/my-computer-32x32.png',
  portfolio: '/98-icons/my-documents-folder-32x32.png',
  x: '/98-icons/internet-explorer-32x32.png',
  times: '/98-icons/notepad-file-32x32.png',
  memory: '/98-icons/folder-32x32.png',
  files: '/98-icons/folder-32x32.png',
  unlocks: '/98-icons/minesweeper-32x32.png',
}

const DEFAULT_WINDOW_LAYOUT: Record<AppId, Omit<DesktopWindow, 'open' | 'minimized' | 'zIndex'>> = {
  terminal: { id: 'terminal', x: 300, y: 72, width: 780, height: 500, maximized: false },
  chat: { id: 'chat', x: 268, y: 90, width: 890, height: 640, maximized: false },
  markets: { id: 'markets', x: 245, y: 90, width: 855, height: 625, maximized: false },
  wallet: { id: 'wallet', x: 300, y: 102, width: 790, height: 580, maximized: false },
  portfolio: { id: 'portfolio', x: 230, y: 82, width: 925, height: 655, maximized: false },
  x: { id: 'x', x: 312, y: 104, width: 745, height: 560, maximized: false },
  times: { id: 'times', x: 252, y: 78, width: 885, height: 630, maximized: false },
  unlocks: { id: 'unlocks', x: 278, y: 84, width: 820, height: 642, maximized: false },
  memory: { id: 'memory', x: 316, y: 100, width: 735, height: 555, maximized: false },
  files: { id: 'files', x: 290, y: 94, width: 805, height: 575, maximized: false },
  media: { id: 'media', x: 320, y: 110, width: 620, height: 520, maximized: false },
  dialer: { id: 'dialer', x: 340, y: 120, width: 420, height: 540, maximized: false },
  ferrari: { id: 'ferrari', x: 360, y: 130, width: 540, height: 460, maximized: false },
  mail: { id: 'mail', x: 300, y: 100, width: 720, height: 540, maximized: false },
  game: { id: 'game', x: 280, y: 80, width: 760, height: 620, maximized: false },
  recycle: { id: 'recycle', x: 310, y: 110, width: 640, height: 500, maximized: false },
  fax: { id: 'fax', x: 330, y: 120, width: 560, height: 500, maximized: false },
  about: { id: 'about', x: 300, y: 90, width: 700, height: 600, maximized: false },
  howitworks: { id: 'howitworks', x: 290, y: 80, width: 740, height: 620, maximized: false },
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
  const [isShutdown, setIsShutdown] = useState(false)
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
  const [typingLabel, setTypingLabel] = useState('TSUN IS THINKING...')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [soundMuted, setSoundMuted] = useState(true)
  const [crtEnabled, setCrtEnabled] = useLocalStorage('tsun-os-crt', true)
  const [selectedDesktopIcon, setSelectedDesktopIcon] = useState<string | null>(null)
  const [quota, setQuota] = useState(0)
  const [isScreensaver, setIsScreensaver] = useState(false)
  const [brandClicks, setBrandClicks] = useState(0)
  const screensaverTimer = useRef<number | null>(null)
  const returnedToastShown = useRef(false)
  const previousSolChange = useRef<number | null>(null)

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
    const nextSolChange = marketResult.assets.solana?.change24h ?? null
    if (nextSolChange !== null && previousSolChange.current !== null && Math.abs(nextSolChange - previousSolChange.current) >= 3) {
      const direction = nextSolChange > previousSolChange.current ? 'up' : 'down'
      addToast({ title: 'TSUN MARKET ALERT', body: `SOL moved sharply ${direction}. Mood protocol: ${nextSolChange > 0 ? 'SMUG' : 'PANICKING'}.`, kind: 'market' })
      setMood(nextSolChange > 0 ? 'SMUG' : 'PANICKING')
    }
    previousSolChange.current = nextSolChange
  }, [addToast])

  useEffect(() => {
    void refreshMarket()
    const interval = window.setInterval(() => void refreshMarket(), 60_000)
    return () => window.clearInterval(interval)
  }, [refreshMarket])

  // Screensaver after 45s inactivity — Stratton 95 style
  useEffect(() => {
    if (isShutdown || !bootComplete) return
    const reset = () => {
      if (isScreensaver) return
      if (screensaverTimer.current) window.clearTimeout(screensaverTimer.current)
      screensaverTimer.current = window.setTimeout(() => setIsScreensaver(true), 45000)
    }
    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'touchstart']
    events.forEach(e => window.addEventListener(e, reset))
    reset()
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      if (screensaverTimer.current) window.clearTimeout(screensaverTimer.current)
    }
  }, [isShutdown, bootComplete, isScreensaver])

  const finishBoot = useCallback(() => {
    setHasBootedBefore(true)
    setBootComplete(true)
    setIsShutdown(false)
  }, [setHasBootedBefore])

  const triggerShutdown = useCallback(() => {
    setLauncherOpen(false)
    setIsShutdown(true)
    addToast({ title: 'TSUN//OS', body: 'Shutting down... It is now safe to turn off your computer.', kind: 'system' })
  }, [addToast])

  const restartFromShutdown = useCallback(() => {
    setIsShutdown(false)
    setBootComplete(false)
    setHasBootedBefore(true)
  }, [setHasBootedBefore])

  useEffect(() => {
    if (!bootComplete || memory.interactionCount === 0 || returnedToastShown.current) return
    returnedToastShown.current = true
    const daysAway = (Date.now() - new Date(memory.lastSeenAt).getTime()) / 86_400_000
    addToast({
      title: 'TSUN//SYSTEM',
      body: daysAway >= 3 ? 'Oh. You are alive.' : 'Welcome back. Your local context has been restored. Do not make it sentimental.',
      kind: 'system',
    })
  }, [addToast, bootComplete, memory.interactionCount])

  const openApp = useCallback((id: AppId) => {
    const reactions: Partial<Record<AppId, { body: string; mood: TsunMood }>> = {
      portfolio: { body: 'Stop staring at my PnL.', mood: 'EMBARRASSED' },
      memory: { body: 'You really went digging through my memory?', mood: 'FLUSTERED' },
      files: { body: 'Do not open anything marked DO NOT OPEN.', mood: 'ANNOYED' },
      ferrari: { body: 'Shortcut corrupted. You cannot afford the gas.', mood: 'SMUG' },
      recycle: { body: 'Digging through trash? Really?', mood: 'ANNOYED' },
      mail: { body: 'You read my mail? Brave.', mood: 'FLUSTERED' },
    }
    const reaction = reactions[id]
    if (reaction) {
      addToast({ title: 'TSUN NOTIFICATION', body: reaction.body, kind: 'mood' })
      setMood(reaction.mood)
    }
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
  }, [addToast, isMobile])

  const handleBrandEasterEgg = useCallback(() => {
    const next = brandClicks + 1
    setBrandClicks(next)
    if (next >= 5) {
      setBrandClicks(0)
      addToast({ title: 'TSUN 98 EASTER EGG', body: 'You clicked TSUN 5 times. TSUN: ...Not that I like you noticing. Mood: DERE unlocked for 10s.', kind: 'mood' })
      const prev = mood
      setMood('DERE')
      setTimeout(() => setMood(prev), 10000)
    } else if (next === 3) {
      addToast({ title: 'TSUN//OS', body: `Clicked ${next} times. Keep going and I might pretend to care.`, kind: 'system' })
    }
    openApp('terminal')
  }, [brandClicks, addToast, mood, openApp])

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

  const resizeWindow = useCallback((id: AppId, width: number, height: number) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], width, height } }))
  }, [])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLauncherOpen(false)
        setMoreOpen(false)
      }
      if (event.key === 'Meta' || event.key === 'OS') {
        event.preventDefault()
        setLauncherOpen(true)
      }
      if (event.altKey && event.key === 'Tab') {
        event.preventDefault()
        const openApps = APP_DEFINITIONS.filter((app) => windows[app.id].open)
        const current = openApps.sort((left, right) => windows[right.id].zIndex - windows[left.id].zIndex)
        if (current.length > 1) openApp(current[1].id)
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'w') {
        const focused = APP_DEFINITIONS.reduce<AppId | null>((top, app) => windows[app.id].open && (!top || windows[app.id].zIndex > windows[top].zIndex) ? app.id : top, null)
        if (focused) closeWindow(focused)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [closeWindow, openApp, windows])

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
    } catch {}
    setWallet(initialWallet)
    addToast({ title: 'WALLET DISCONNECTED', body: 'Public wallet context was removed from this session.', kind: 'secure' })
  }, [addToast])

  const handleFloorAction = useCallback((action: 'motivate'|'drill'|'lunch') => {
    if (action === 'motivate') {
      setQuota((q) => Math.min(250000, q + 15000))
      addToast({ title: 'TSUN SALES FLOOR', body: 'TSUN: Listen up. We are not here to make friends. We are here to verify data before claiming conviction. Now dial.', kind: 'market' })
      setMood('SMUG')
    } else if (action === 'drill') {
      addToast({ title: 'TSUN DRILL', body: 'TSUN: Pop quiz. What is the only valid price? A verified price. What do we never do? Invent numbers.', kind: 'mood' })
      setMood('ANGRY')
    } else {
      addToast({ title: 'TSUN LUNCH', body: 'TSUN: Lunch is simulated until morale improves. The market is still wrong. Eat your feelings, not your PnL.', kind: 'system' })
      setMood('NORMAL')
    }
  }, [addToast])

  const handleSend = useCallback(async (body: string) => {
    if (sending || !body.trim()) return
    const trimmed = body.trim()
    const userMessage: ChatMessage = { id: uniqueId('user'), role: 'user', body: trimmed, createdAt: new Date().toISOString() }
    setMessages((current) => [...current, userMessage])
    setSending(true)

    const lower = trimmed.toLowerCase()
    if (lower.includes('wallet') || lower.includes('balance') || lower.includes('my money')) {
      setTypingLabel('CHECKING YOUR WALLET...')
    } else if (lower.includes('sol') || lower.includes('btc') || lower.includes('market') || lower.includes('price') || lower.includes('tsun token')) {
      setTypingLabel('FETCHING MARKET DATA...')
    } else if ((memory.relationship === 'DERE' || memory.relationship === 'FAVORITE DEGEN') && Math.random() < 0.22) {
      setTypingLabel('PRETENDING NOT TO CARE...')
    } else {
      setTypingLabel('TSUN IS THINKING...')
    }

    try {
      const result = await requestTsunReply({
        prompt: trimmed,
        messages,
        mood,
        memory,
        market,
        token,
        wallet,
      })

      const tsunMessage: ChatMessage = {
        id: uniqueId('tsun'),
        role: 'tsun',
        body: result.reply,
        mood: result.mood,
        toolCard: result.toolCard,
        createdAt: new Date().toISOString(),
      }
      setMessages((current) => [...current, tsunMessage])
      if (mood !== result.mood) {
        addToast({ title: 'TSUN MOOD CHANGED', body: `${mood} → ${result.mood}`, kind: 'mood' })
      }
      setMood(result.mood)
      setMemory((current) => {
        const nextCount = current.interactionCount + 1
        const discussed = [...current.discussedAssets]
        if (lower.includes('sol') && !discussed.includes('SOL')) discussed.push('SOL')
        if ((lower.includes('btc') || lower.includes('bitcoin')) && !discussed.includes('BTC')) discussed.push('BTC')
        if (lower.includes('tsun') && !discussed.includes('TSUN')) discussed.push('TSUN')
        const notes = [...current.notes]
        const noteToAdd = result.memoryNote
        if (noteToAdd && !notes.includes(noteToAdd)) notes.unshift(noteToAdd)
        return {
          ...current,
          interactionCount: nextCount,
          relationship: relationshipFromInteractions(nextCount),
          lastSeenAt: new Date().toISOString(),
          discussedAssets: discussed.slice(0, 6),
          notes: notes.slice(0, 8),
        }
      })

      if (result.source !== 'fallback') {
        addToast({ title: `TSUN REPLY VIA ${result.source.toUpperCase()}`, body: result.reply.slice(0, 88), kind: 'system' })
      }
    } catch (e) {
      console.error('[handleSend] failed', e)
      addToast({ title: 'TSUN//SYSTEM', body: 'Chat link failed. Using offline fallback.', kind: 'system' })
    } finally {
      setSending(false)
    }
  }, [addToast, market, memory, messages, mood, sending, setMemory, setMessages, token, wallet])

  const appContent = useCallback((id: AppId) => {
    switch (id) {
      case 'terminal': return <Terminal market={market} token={token} mood={mood} onRefresh={() => void refreshMarket()} onOpenChat={() => openApp('chat')} />
      case 'chat': return <Chat messages={messages} mood={mood} memory={memory} sending={sending} typingLabel={typingLabel} onSend={handleSend} />
      case 'markets': return <MarketsApp market={market} token={token} onRefresh={() => void refreshMarket()} />
      case 'wallet': return <WalletApp wallet={wallet} market={market} onConnect={() => void handleConnectWallet()} onDisconnect={() => void handleDisconnectWallet()} onInspect={(address) => void handleInspectAddress(address)} />
      case 'portfolio': return <PortfolioApp />
      case 'x': return <XApp />
      case 'times': return <TimesApp onOpenApp={openApp} />
      case 'unlocks': return <UnlocksApp />
      case 'memory': return <MemoryApp memory={memory} />
      case 'files': return <FilesApp />
      case 'media': return <MediaPlayerApp onToast={(t,b)=>addToast({title:t, body:b, kind:'system'})} />
      case 'dialer': return <PhoneDialerApp onToast={(t,b)=>addToast({title:t, body:b, kind:'system'})} />
      case 'ferrari': return <FerrariApp onToast={(t,b)=>addToast({title:t, body:b, kind:'system'})} />
      case 'mail': return <MailApp />
      case 'game': return <GameApp quota={quota} onMotivate={()=>handleFloorAction('motivate')} onDrill={()=>handleFloorAction('drill')} onLunch={()=>handleFloorAction('lunch')} mood={mood} />
      case 'recycle': return <RecycleApp onToast={(t,b)=>addToast({title:t, body:b, kind:'system'})} />
      case 'fax': return <FaxApp onToast={(t,b)=>addToast({title:t, body:b, kind:'system'})} />
      case 'about': return <AboutApp />
      case 'howitworks': return <HowItWorksApp onOpen={(id)=>openApp(id as AppId)} />
      default: return null
    }
  }, [handleConnectWallet, handleDisconnectWallet, handleInspectAddress, handleSend, market, memory, messages, mood, openApp, refreshMarket, sending, token, wallet, typingLabel, quota, handleFloorAction])

  const activeWindowApps = useMemo(() => APP_DEFINITIONS.filter((app) => windows[app.id].open), [windows])
  const primaryDesktopIcons: AppId[] = ['terminal', 'chat', 'markets', 'wallet', 'portfolio', 'x', 'times', 'memory', 'files', 'unlocks', 'media', 'dialer', 'ferrari', 'mail', 'game', 'recycle', 'fax', 'about', 'howitworks']
  const sol = market.assets.solana

  if (isShutdown) {
    return <ShutdownScreen onRestart={restartFromShutdown} />
  }

  if (!bootComplete) {
    return <BootScreen mood={mood} relationship={memory.relationship} marketStatus={market.status} returning={hasBootedBefore} onComplete={finishBoot} />
  }

  if (isScreensaver) {
    return (
      <div className="screensaver" onClick={() => setIsScreensaver(false)} onKeyDown={() => setIsScreensaver(false)} tabIndex={0} role="button" aria-label="Screensaver, click to wake">
        <div className="screensaver-logo">TSUN 98</div>
        <div className="screensaver-text">TSUN IS WATCHING — MOVE MOUSE OR CLICK TO WAKE — PRESS ANY KEY</div>
      </div>
    )
  }

  return (
    <main className={cn('tsun-os', `mood-${mood.toLowerCase()}`)}>
      <div className="desktop-texture" />
      <CRTOverlay enabled={crtEnabled} />
      <header className="global-bar">
        <button type="button" className="brand-lockup" onClick={handleBrandEasterEgg} aria-label="Open TSUN terminal"><span className="brand-caret">&gt;_</span><span>TSUN//OS</span><span className="brand-98">98</span></button>
        <div className="global-ticker">
          <button type="button" onClick={() => openApp('terminal')} className="ticker-chip tsun-ticker"><span>TSUN</span><strong>{token.priceUsd !== null ? formatCurrency(token.priceUsd, { digits: 7 }) : token.address ? 'FEED UNAVAILABLE' : 'AWAITING CONFIG'}</strong>{token.change24h !== null && <em className={token.change24h >= 0 ? 'positive' : 'negative'}>{formatPercent(token.change24h)}</em>}</button>
          <button type="button" onClick={() => openApp('markets')} className="ticker-chip"><span>SOL</span><strong>{sol ? formatCurrency(sol.priceUsd) : 'UNAVAILABLE'}</strong>{sol && <em className={sol.change24h >= 0 ? 'positive' : 'negative'}>{formatPercent(sol.change24h)}</em>}</button>
          <span className="market-open"><i /> MARKET CONTEXT</span>
          <span className="ticker-25c">25¢</span>
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
          <div className="desktop-side-stack">
            <aside className="desktop-market-monitor" aria-label="TSUN desktop market monitor">
              <div className="monitor-title"><span>TSUN 98 // MONITOR</span><i /></div>
              <div className="monitor-cam">CAM 04 · TRADING FLOOR 4 — SHIBUYA</div>
              <div className="monitor-actions">
                <button type="button" onClick={() => handleFloorAction('motivate')}>📣 Motivate</button>
                <button type="button" onClick={() => handleFloorAction('drill')}>👮 Drill</button>
                <button type="button" onClick={() => handleFloorAction('lunch')}>🍕 Lunch</button>
              </div>
              <div className="monitor-quota">Daily quota ${quota.toLocaleString()} / $250.0k — 12 brokers {sending ? '1 on line' : '0 on lines'}</div>
              <div className="monitor-broker-table">
                <div className="broker-mini-head"><span>NAME</span><span>CALLS</span><span>GROSS</span></div>
                <div><span>Stevie 2-Phones</span><span>142</span><span>$12k</span></div>
                <div><span>Sal 'Moose'</span><span>98</span><span>$8k</span></div>
                <div><span>TSUN AI</span><span>0</span><span>VERIFY</span></div>
              </div>
              <div><span>BTC</span><strong>{market.assets.bitcoin ? formatCurrency(market.assets.bitcoin.priceUsd) : 'UNAVAILABLE'}</strong></div>
              <div><span>SOL</span><strong>{sol ? formatCurrency(sol.priceUsd) : 'UNAVAILABLE'}</strong><em className={sol && sol.change24h >= 0 ? 'positive' : 'negative'}>{sol ? formatPercent(sol.change24h) : 'NO SOURCE'}</em></div>
              <div><span>TSUN</span><strong>{token.priceUsd !== null ? formatCurrency(token.priceUsd, { digits: 7 }) : 'UNAVAILABLE'}</strong></div>
              <footer><span>MOOD {mood}</span><b>{market.status === 'live' ? 'ONLINE' : 'SYNCING'}</b></footer>
            </aside>

            <NowPlaying onToast={(title, body) => addToast({ title, body, kind: 'system' })} />

            <aside className="parody-disclaimer">
              <span>A note about all this — TSUN 98</span>
              <p>Parody fan project. TSUN is fictional 24yo adult AI. Token metrics verified when available. Every figure invented until real source. Not financial advice. Inspired by stratton.capital vibe.</p>
            </aside>
          </div>

          <div className="desktop-icons" aria-label="TSUN OS applications">
            {primaryDesktopIcons.map((id) => {
              const app = APP_BY_ID[id]
              const Icon = app.icon
              const iconAsset = DESKTOP_ICON_ASSETS[id]
              return <button type="button" className={cn('desktop-icon', selectedDesktopIcon === id && 'selected')} key={id} onClick={() => setSelectedDesktopIcon(id)} onDoubleClick={() => openApp(id)} onKeyDown={(event) => { if (event.key === 'Enter') openApp(id) }}><span>{iconAsset ? <img src={iconAsset} alt="" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }} /> : <Icon size={23} />}</span><small>{app.shortTitle}</small></button>
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
              onResize={(width, height) => resizeWindow(app.id, width, height)}
              live={app.id === 'terminal' || app.id === 'markets'}
            >{appContent(app.id)}</WindowFrame>
          })}
          {activeWindowApps.length === 0 && <div className="desktop-empty"><MonitorUp size={29} /><strong>NO APPLICATIONS OPEN</strong><span>Open a system app from the dock or desktop. Try Media Player or Boiler Room Tycoon.</span></div>}
        </section>
      )}

      {!isMobile && <TickerTape />}

      {launcherOpen && !isMobile && <AppLauncher onOpen={openApp} onShutdown={triggerShutdown} onClose={() => setLauncherOpen(false)} onToggleCrt={() => setCrtEnabled((value) => !value)} crtEnabled={crtEnabled} onToast={addToast} />}
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
      <button type="button" className="taskbar-start" onClick={onToggleLauncher}><img src="/98-icons/start.png" alt="" /><span>Start</span></button>
      <div className="taskbar-apps">{activeApps.map((id) => { const app = APP_BY_ID[id]; const Icon = app.icon; return <button type="button" key={id} className={cn('taskbar-app', windows[id].minimized && 'minimized')} onClick={() => onOpen(id)}><Icon size={14} /><span>{app.shortTitle}</span></button> })}</div>
      <div className="taskbar-status"><span className="taskbar-status-label">TSUN 98 — LOCAL SESSION</span><span>{time} UTC</span><button type="button" className="power-button" title="Session is browser local only"><Power size={14} /></button></div>
    </footer>
  )
}

function AppLauncher({ onOpen, onClose, onToggleCrt, crtEnabled, onShutdown, onToast }: { onOpen: (id: AppId) => void; onClose: () => void; onToggleCrt: () => void; crtEnabled: boolean; onShutdown: () => void; onToast: (t: Omit<Toast,'id'>)=>void }) {
  const recentApps: AppId[] = ['terminal', 'chat', 'markets', 'game']
  const systemLinks: Array<{ label: string; id?: AppId; gag?: string }> = [
    { label: 'My Computer', id: 'terminal' },
    { label: 'Documents', id: 'files' },
    { label: 'Settings' },
    { label: 'Find: the money', gag: 'TSUN: The money is in verified data. Not in the Start menu.' },
    { label: 'Find: the PnL', gag: 'TSUN: My PnL is simulated until the desk says otherwise. Stop searching.' },
    { label: 'Find: the alpha', gag: 'TSUN: Alpha is not in the Start menu. Try asking about SOL.' },
    { label: 'Help', gag: 'TSUN: Help? You want help? Read the market. Then read it again.' },
    { label: 'Run...', id: 'terminal' },
  ]
  return (
    <aside className="app-launcher xp-start-menu">
      <div className="launcher-user"><span className="start-user-mark">T</span><div><strong>TSUN OPERATOR</strong><small>TSUN 98 — SHIBUYA FLOOR 4</small></div><button type="button" onClick={onClose} aria-label="Close Start menu"><X size={14} /></button></div>
      <div className="start-columns">
        <div className="start-recent"><span className="start-column-label">Recently used — TSUN 98</span>{recentApps.map((id) => { const app = APP_BY_ID[id]; const Icon = app.icon; return <button type="button" key={id} onClick={() => onOpen(id)}><Icon size={22} /><span><strong>{app.title}</strong><small>{app.description}</small></span></button> })}<button type="button" className="all-programs" onClick={() => onOpen('terminal')}><Grid2X2 size={16} /><strong>All Programs</strong><ChevronDown size={14} /></button></div>
        <div className="start-system"><span className="start-column-label">TSUN//OS</span>{systemLinks.map((item) => <button type="button" key={item.label} onClick={() => {
          if (item.id) onOpen(item.id)
          else if (item.gag) { onToast({ title: 'TSUN 98 SEARCH', body: item.gag, kind: 'mood' }); onClose() }
          else onClose()
        }}><span className="start-system-icon">{item.label.includes('Find') ? <Search size={16} /> : <MonitorUp size={16} />}</span><strong>{item.label}</strong></button>)}<div className="start-divider" /><button type="button" onClick={onToggleCrt}><span className="start-system-icon"><MonitorUp size={16} /></span><strong>CRT Monitor: {crtEnabled ? 'toggle glass' : 'glass off'}</strong></button></div>
      </div>
      <div className="start-footer"><button type="button" onClick={onClose}><Power size={15} /> Log Off</button><button type="button" onClick={onShutdown}><Power size={15} /> Shut Down...</button></div>
    </aside>
  )
}

function MoreDrawer({ onOpen, onClose }: { onOpen: (id: AppId) => void; onClose: () => void }) {
  const moreApps: AppId[] = ['wallet', 'portfolio', 'x', 'times', 'unlocks', 'files', 'memory', 'media', 'dialer', 'mail', 'game', 'recycle', 'ferrari', 'fax', 'about', 'howitworks']
  return (
    <aside className="more-drawer">
      <div className="more-drawer-header"><div><span className="eyebrow">TSUN 98 // OS</span><h2>More applications</h2></div><button type="button" onClick={onClose}><X size={17} /></button></div>
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
