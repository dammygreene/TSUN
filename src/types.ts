import type { LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'

export type TsunMood =
  | 'NORMAL'
  | 'ANNOYED'
  | 'ANGRY'
  | 'FURIOUS'
  | 'SMUG'
  | 'EMBARRASSED'
  | 'FLUSTERED'
  | 'HAPPY'
  | 'PANICKING'
  | 'DERE'

export type RelationshipLevel =
  | 'STRANGER'
  | 'ANNOYING TRADER'
  | 'REGULAR'
  | 'TOLERABLE HUMAN'
  | 'FAVORITE DEGEN'
  | 'DERE'

export type AppId =
  | 'terminal'
  | 'chat'
  | 'markets'
  | 'wallet'
  | 'portfolio'
  | 'x'
  | 'times'
  | 'unlocks'
  | 'memory'
  | 'files'
  | 'media'
  | 'dialer'
  | 'ferrari'
  | 'mail'
  | 'game'
  | 'recycle'

export type DataStatus = 'live' | 'loading' | 'stale' | 'unavailable'

export interface MarketAsset {
  id: 'solana' | 'bitcoin'
  symbol: 'SOL' | 'BTC'
  name: string
  priceUsd: number
  change24h: number
}

export interface MarketState {
  status: DataStatus
  source: string
  fetchedAt: string | null
  error: string | null
  assets: Partial<Record<MarketAsset['id'], MarketAsset>>
  chartPrices: Array<[number, number]>
  chartFetchedAt: string | null
}

export interface TokenState {
  address: string | null
  status: DataStatus
  source: string
  fetchedAt: string | null
  error: string | null
  pairLabel: string | null
  dexUrl: string | null
  priceUsd: number | null
  priceNative: number | null
  change24h: number | null
  marketCap: number | null
  volume24h: number | null
  liquidityUsd: number | null
}

export interface WalletState {
  address: string | null
  solBalance: number | null
  balanceFetchedAt: string | null
  error: string | null
  isLoading: boolean
  mode: 'idle' | 'connected' | 'inspecting'
}

export interface UserMemory {
  firstSeenAt: string
  lastSeenAt: string
  interactionCount: number
  relationship: RelationshipLevel
  discussedAssets: string[]
  notes: string[]
}

export interface ToolCardData {
  label: string
  symbol: string
  price?: number
  change?: number
  value?: string
  updatedAt: string | null
  source?: string
  error?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'tsun' | 'system'
  body: string
  createdAt: string
  mood?: TsunMood
  toolCard?: ToolCardData
}

export interface DesktopWindow {
  id: AppId
  open: boolean
  minimized: boolean
  maximized: boolean
  zIndex: number
  x: number
  y: number
  width: number
  height: number
}

export interface Toast {
  id: string
  title: string
  body: string
  kind: 'market' | 'system' | 'mood' | 'secure'
}

export interface TsunTrade {
  id: string
  side: 'BUY' | 'SELL'
  asset: string
  quantity: number
  price: number
  valueUsd: number
  timestamp: string
  pnl?: number
  note: string
}

export interface TsunPosition {
  asset: string
  symbol: string
  allocation: number
  quantity: number
  avgEntry: number
  markPrice: number
  pnl: number
}

export interface TsunAppDefinition {
  id: AppId
  title: string
  shortTitle: string
  icon: LucideIcon
  desktop: boolean
  mobile: boolean
  description: string
  component?: ComponentType
}

export interface NewsStory {
  id: string
  section: string
  headline: string
  dek: string
  timestamp: string
  source: string
  linkedApp: AppId
}

export interface Milestone {
  target: number
  label: string
  status: 'reached' | 'active' | 'locked'
  reachedAt?: string
  reward: string
  behavior: string
}

export interface LoreFile {
  id: string
  path: string
  title: string
  type: 'text' | 'executable' | 'audio'
  body: string
  locked?: boolean
}
