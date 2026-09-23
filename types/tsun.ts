// Shared TSUN domain types. Business logic lives in /lib, never here.

export type TsunMood =
  | "NORMAL"
  | "ANNOYED"
  | "ANGRY"
  | "FURIOUS"
  | "SMUG"
  | "EMBARRASSED"
  | "FLUSTERED"
  | "HAPPY"
  | "PANICKING"
  | "DERE";

export type RelationshipLevel =
  | "STRANGER"
  | "ANNOYING TRADER"
  | "REGULAR"
  | "TOLERABLE HUMAN"
  | "FAVORITE DEGEN"
  | "DERE";

/** Every live-data UI must support all five states. Never leave ambiguity. */
export type DataState = "loading" | "loaded" | "stale" | "error" | "unavailable";

/** Standard envelope for all tool/provider results. Numbers only come from tools. */
export interface ToolResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  /** ISO timestamp of the fetch attempt. */
  fetchedAt: string;
  /** Human readable source label, e.g. "CoinGecko", "DexScreener", "SIMULATED". */
  source: string;
  /** True when serving cached data past the fresh TTL. */
  stale?: boolean;
  /** ISO timestamp of the last successful fetch, when known. */
  lastSuccessAt?: string;
}

export interface TokenQuote {
  symbol: string;
  name: string;
  /** Price in USD. Null when unknown. Never fabricated. */
  priceUsd: number | null;
  change24h: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  holders: number | null;
  pair?: string;
}

export interface MarketMover {
  symbol: string;
  priceUsd: number | null;
  change24h: number | null;
}

export interface MarketOverview {
  sol: TokenQuote | null;
  btc: TokenQuote | null;
  tsun: TokenQuote | null;
  movers: MarketMover[];
  /** "RISK ON" | "RISK OFF" | "CHOP" | null when unknown */
  sentiment: string | null;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type TradeSide = "BUY" | "SELL";

export interface TsunTrade {
  id: string;
  side: TradeSide;
  asset: string;
  quantity: number;
  price: number;
  valueUsd: number;
  timestamp: string;
  txSignature?: string;
  /** True only for on-chain verified trades. Simulated trades are false. */
  verified: boolean;
  simulated: boolean;
}

export interface TsunPosition {
  asset: string;
  quantity: number;
  avgEntry: number;
  currentPrice: number | null;
  valueUsd: number | null;
  unrealizedPnlUsd: number | null;
  unrealizedPnlPct: number | null;
}

export interface PortfolioSummary {
  mode: "SIMULATED" | "LIVE";
  startingNavUsd: number;
  currentNavUsd: number | null;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number | null;
  totalPnlUsd: number | null;
  totalPnlPct: number | null;
  winRate: number | null;
  maxDrawdownPct: number | null;
  bestTradeId: string | null;
  worstTradeId: string | null;
  positions: TsunPosition[];
  trades: TsunTrade[];
  updatedAt: string;
}

export interface WalletHolding {
  mint: string;
  symbol: string;
  amount: number;
  valueUsd: number | null;
  pct: number | null;
}

export interface WalletAnalysis {
  address: string;
  solBalance: number | null;
  totalValueUsd: number | null;
  holdings: WalletHolding[];
  largestHoldingSymbol: string | null;
  stablecoinPct: number | null;
  concentrationNote: string | null;
}

export interface UserContext {
  userId: string;
  walletAddress: string | null;
  displayName: string | null;
}

export interface DataStatus {
  market: DataState;
  solanaRpc: DataState;
  tsunToken: DataState;
  lastUpdatedAt: string | null;
}

export interface TsunState {
  mood: TsunMood;
  relationship: RelationshipLevel;
  currentQuote: string | null;
  token: TokenQuote | null;
  market: MarketOverview | null;
  portfolio: PortfolioSummary | null;
  activeEvents: AgentEvent[];
  user: UserContext | null;
  dataStatus: DataStatus;
}

export type AgentEventType =
  | "MARKET_MOVE"
  | "PORTFOLIO_TRADE"
  | "PORTFOLIO_DRAW_DOWN"
  | "MILESTONE_REACHED"
  | "X_POST_PUBLISHED"
  | "USER_RETURNED"
  | "RELATIONSHIP_CHANGED"
  | "MOOD_CHANGED";

export type EventSeverity = 1 | 2 | 3;

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  severity: EventSeverity;
  title: string;
  body: string;
  createdAt: string;
  linkedApp?: string;
  fact?: Record<string, number | string | null>;
}

export type MilestoneStatus = "LOCKED" | "UNLOCKED";

export interface Milestone {
  id: string;
  targetMarketCap: number;
  status: MilestoneStatus;
  reachedAt: string | null;
  marketCapAtTrigger: number | null;
  title: string;
  dialogueUnlock: string;
  personalityUnlock: string;
  visualUnlock: string;
  artworkUrl: string | null;
  postId: string | null;
}

export type TsunFileType = "text" | "audio" | "image" | "executable";

export interface TsunFile {
  id: string;
  path: string;
  title: string;
  type: TsunFileType;
  folder: string;
  /** Short teaser shown in listings. */
  blurb: string;
  unlockedAtStart: boolean;
  unlockCondition?: string;
  body?: string;
  eventTrigger?: string;
}

export type XPostStatus = "staging" | "published";

export interface XPost {
  id: string;
  content: string;
  createdAt: string;
  status: XPostStatus;
  sourceEvent: string | null;
  mediaUrl: string | null;
  xPostId: string | null;
  xUrl: string | null;
  tab: "POSTS" | "PORTFOLIO" | "MARKET" | "MILESTONES";
}

export interface TimesArticle {
  id: string;
  headline: string;
  subhead: string;
  body: string;
  timestamp: string;
  sourceEvent: string;
  fact: Record<string, number | string | null>;
}

export interface TimesIssue {
  volume: string;
  generatedAt: string;
  main: TimesArticle;
  stories: TimesArticle[];
}

export type ChatRole = "user" | "tsun" | "system";

export interface ToolCardData {
  kind: "market" | "wallet" | "portfolio";
  title: string;
  rows: { label: string; value: string }[];
  freshness: string;
  source: string;
  state: DataState;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  mood?: TsunMood;
  toolCard?: ToolCardData;
}

export interface UserMemory {
  userId: string;
  relationship: RelationshipLevel;
  /** Internal score. Never show the raw score in UI, only the named level. */
  score: number;
  interactionCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  discussedAssets: string[];
  summaries: string[];
  notes: string[];
}
