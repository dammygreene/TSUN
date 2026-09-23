// Central TSUN state: character, market, OS windows, notifications, boot.
// One zustand store (single window manager context per spec). Persisted subset
// rehydrates on the client only; SSR uses skipHydration for safety.
"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AgentEvent,
  DataStatus,
  MarketOverview,
  Milestone,
  RelationshipLevel,
  TokenQuote,
  TsunMood,
  UserContext,
} from "@/types/tsun";
import { MOOD_STATUS_LINE, shouldApplyMood } from "@/lib/mood/engine";
import { applyRelationshipEvent, type RelationshipEventKind } from "@/lib/relationship/engine";
import { evaluateMilestones, loadMilestoneState } from "@/lib/milestones/registry";
import { emit, makeEvent } from "@/lib/events/bus";

export type AppId =
  | "terminal"
  | "chat"
  | "markets"
  | "wallet"
  | "portfolio"
  | "x"
  | "newspaper"
  | "unlocks"
  | "memory"
  | "files";

export interface WindowState {
  id: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  kind: "market" | "character" | "system";
}

export type BootStage = "IDLE" | "BIOS" | "MEMORY" | "NETWORK" | "DATA" | "PORTFOLIO" | "USER" | "READY";

const DEFAULT_DATA_STATUS: DataStatus = {
  market: "loading",
  solanaRpc: "loading",
  tsunToken: "loading",
  lastUpdatedAt: null,
};

function cascadeWindow(id: AppId, count: number, z: number): WindowState {
  const offset = (count % 6) * 36;
  return {
    id,
    x: 90 + offset,
    y: 56 + offset,
    w: id === "chat" ? 920 : 860,
    h: id === "chat" ? 600 : 560,
    z,
    minimized: false,
    maximized: false,
  };
}

interface TsunStore {
  // Character
  mood: TsunMood;
  lastMoodAt: number;
  relationship: RelationshipLevel;
  score: number;
  interactionCount: number;
  currentQuote: string;
  // Data
  market: MarketOverview | null;
  token: TokenQuote | null;
  dataStatus: DataStatus;
  athMarketCap: number | null;
  milestones: Milestone[];
  // OS
  bootStage: BootStage;
  booted: boolean;
  bootCompressed: boolean;
  windows: WindowState[];
  activeWindow: AppId | null;
  zTop: number;
  activeMobileApp: AppId;
  mobileMoreOpen: boolean;
  notices: Notice[];
  majorEvent: AgentEvent | null;
  activeEvents: AgentEvent[];
  marketAlertsMuted: boolean;
  charAlertsMuted: boolean;
  soundOn: boolean;
  reducedMotion: boolean;
  portfolioViewed: boolean;
  unlockedFiles: string[];
  user: UserContext | null;

  // Actions
  requestMood: (next: TsunMood, reason?: string) => void;
  addRelationship: (kind: RelationshipEventKind) => void;
  bumpInteraction: () => void;
  setMarket: (market: MarketOverview | null) => void;
  ingestTokenQuote: (quote: TokenQuote | null) => void;
  setDataStatus: (partial: Partial<DataStatus>) => void;
  setBootStage: (stage: BootStage) => void;
  completeBoot: () => void;
  skipBoot: () => void;
  openApp: (id: AppId) => void;
  closeApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  toggleMinimize: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  moveWindow: (id: AppId, x: number, y: number) => void;
  resizeWindow: (id: AppId, w: number, h: number) => void;
  setActiveMobileApp: (id: AppId) => void;
  setMobileMoreOpen: (open: boolean) => void;
  pushNotice: (n: Omit<Notice, "id" | "createdAt">) => void;
  dismissNotice: (id: string) => void;
  recordEvent: (e: AgentEvent) => void;
  dismissMajor: () => void;
  setMarketAlertsMuted: (v: boolean) => void;
  setCharAlertsMuted: (v: boolean) => void;
  setSoundOn: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  markPortfolioViewed: () => void;
  refreshFileUnlocks: () => void;
  setUser: (u: UserContext | null) => void;
  setWalletAddress: (address: string | null) => void;
}

let noticeSeq = 0;

export const useTsunStore = create<TsunStore>()(
  persist(
    (set, get) => ({
      mood: "ANNOYED",
      lastMoodAt: 0,
      relationship: "STRANGER",
      score: 0,
      interactionCount: 0,
      currentQuote: MOOD_STATUS_LINE.ANNOYED,
      market: null,
      token: null,
      dataStatus: DEFAULT_DATA_STATUS,
      athMarketCap: null,
      milestones: createLazyMilestones(),
      bootStage: "IDLE",
      booted: false,
      bootCompressed: false,
      windows: [],
      activeWindow: null,
      zTop: 10,
      activeMobileApp: "terminal",
      mobileMoreOpen: false,
      notices: [],
      majorEvent: null,
      activeEvents: [],
      marketAlertsMuted: false,
      charAlertsMuted: false,
      soundOn: false,
      reducedMotion: false,
      portfolioViewed: false,
      unlockedFiles: ["readme", "firing", "risk", "excuses", "solfinal", "neveradmit", "humility", "mix"],
      user: null,

      requestMood: (next, reason) => {
        const { mood, lastMoodAt } = get();
        const now = Date.now();
        if (!shouldApplyMood(mood, next, lastMoodAt, now)) return;
        set({ mood: next, lastMoodAt: now, currentQuote: MOOD_STATUS_LINE[next] });
        emit(
          makeEvent({
            type: "MOOD_CHANGED",
            severity: 1,
            title: "TSUN MOOD CHANGED",
            body: `${mood} -> ${next}${reason ? `. ${reason}` : ""}`,
          }),
        );
      },

      addRelationship: (kind) => {
        const { score } = get();
        const t = applyRelationshipEvent(score, kind);
        set({ score: t.score, relationship: t.level });
        if (t.leveledUp) {
          emit(
            makeEvent({
              type: "RELATIONSHIP_CHANGED",
              severity: 2,
              title: "RELATIONSHIP CHANGED",
              body: `${t.prevLevel} -> ${t.level}. Do not make it weird.`,
              linkedApp: "memory",
            }),
          );
          get().refreshFileUnlocks();
        }
      },

      bumpInteraction: () => set((s) => ({ interactionCount: s.interactionCount + 1 })),

      setMarket: (market) => set({ market }),

      ingestTokenQuote: (quote) => {
        if (!quote || quote.marketCapUsd == null) {
          set({ token: quote });
          return;
        }
        const { athMarketCap, milestones } = get();
        const ath = athMarketCap == null ? quote.marketCapUsd : Math.max(athMarketCap, quote.marketCapUsd);
        const { state, newlyUnlocked } = evaluateMilestones(quote.marketCapUsd, milestones);
        set({ token: quote, athMarketCap: ath, milestones: state });
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem("tsun.milestones.v1", JSON.stringify(state));
          }
        } catch {
          /* ignore */
        }
        for (const m of newlyUnlocked) {
          emit(
            makeEvent({
              type: "MILESTONE_REACHED",
              severity: 3,
              title: `TSUN HAS HIT ${m.title}`,
              body: `NEW CHARACTER STATE UNLOCKED: ${m.dialogueUnlock}`,
              linkedApp: "unlocks",
              fact: { target: m.title, marketCap: m.marketCapAtTrigger },
            }),
          );
        }
      },

      setDataStatus: (partial) =>
        set((s) => ({ dataStatus: { ...s.dataStatus, ...partial, lastUpdatedAt: new Date().toISOString() } })),

      setBootStage: (stage) => set({ bootStage: stage }),
      completeBoot: () => set({ bootStage: "READY", booted: true }),
      skipBoot: () => set({ bootStage: "READY", booted: true, bootCompressed: true }),

      openApp: (id) => {
        const { windows, zTop } = get();
        const existing = windows.find((w) => w.id === id);
        if (existing) {
          const z = zTop + 1;
          set({
            zTop: z,
            activeWindow: id,
            windows: windows.map((w) => (w.id === id ? { ...w, minimized: false, z } : w)),
          });
          return;
        }
        const z = zTop + 1;
        set({ zTop: z, activeWindow: id, windows: [...windows, cascadeWindow(id, windows.length, z)] });
      },
      closeApp: (id) =>
        set((s) => {
          const windows = s.windows.filter((w) => w.id !== id);
          const rest = windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z);
          return { windows, activeWindow: rest[0]?.id ?? null };
        }),
      focusApp: (id) => {
        const { windows, zTop } = get();
        if (!windows.some((w) => w.id === id)) return;
        const z = zTop + 1;
        set({ zTop: z, activeWindow: id, windows: windows.map((w) => (w.id === id ? { ...w, z } : w)) });
      },
      toggleMinimize: (id) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)),
          activeWindow: s.activeWindow === id ? null : s.activeWindow,
        })),
      toggleMaximize: (id) =>
        set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)) })),
      moveWindow: (id, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, x: Math.max(0, x), y: Math.max(0, y) } : w)),
        })),
      resizeWindow: (id, w, h) =>
        set((s) => ({
          windows: s.windows.map((win) =>
            win.id === id ? { ...win, w: Math.min(1400, Math.max(320, w)), h: Math.min(900, Math.max(240, h)) } : win,
          ),
        })),

      setActiveMobileApp: (id) => set({ activeMobileApp: id, mobileMoreOpen: false }),
      setMobileMoreOpen: (open) => set({ mobileMoreOpen: open }),

      pushNotice: (n) => {
        noticeSeq += 1;
        const notice: Notice = { ...n, id: `notice-${Date.now().toString(36)}-${noticeSeq}`, createdAt: new Date().toISOString() };
        set((s) => ({ notices: [notice, ...s.notices].slice(0, 5) }));
      },
      dismissNotice: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),

      recordEvent: (e) => {
        set((s) => ({ activeEvents: [e, ...s.activeEvents].slice(0, 20) }));
        if (e.severity >= 3) {
          set({ majorEvent: e });
          return;
        }
        if (e.severity === 2) {
          const { marketAlertsMuted, charAlertsMuted } = get();
          const isMarket = e.type === "MARKET_MOVE" || e.type === "PORTFOLIO_TRADE" || e.type === "PORTFOLIO_DRAW_DOWN";
          if (isMarket && marketAlertsMuted) return;
          if (!isMarket && charAlertsMuted) return;
          get().pushNotice({
            title: e.title,
            body: e.body,
            kind: isMarket ? "market" : e.type === "MOOD_CHANGED" ? "character" : "system",
          });
        }
      },
      dismissMajor: () => set({ majorEvent: null }),

      setMarketAlertsMuted: (v) => set({ marketAlertsMuted: v }),
      setCharAlertsMuted: (v) => set({ charAlertsMuted: v }),
      setSoundOn: (v) => set({ soundOn: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
      markPortfolioViewed: () => {
        set({ portfolioViewed: true });
        set((s) => (s.unlockedFiles.includes("embarrassing") ? s : { unlockedFiles: [...s.unlockedFiles, "embarrassing"] }));
      },
      refreshFileUnlocks: () => {
        const { relationship, unlockedFiles } = get();
        const next = new Set(unlockedFiles);
        const rank = ["STRANGER", "ANNOYING TRADER", "REGULAR", "TOLERABLE HUMAN", "FAVORITE DEGEN", "DERE"].indexOf(relationship);
        if (rank >= 2) next.add("donotopen");
        if (rank >= 3) next.add("memo001");
        if (next.size !== unlockedFiles.length) set({ unlockedFiles: [...next] });
      },
      setUser: (u) => set({ user: u }),
      setWalletAddress: (address) =>
        set((s) => ({ user: { userId: s.user?.userId ?? `user_${Date.now().toString(36)}`, walletAddress: address, displayName: s.user?.displayName ?? null } })),
    }),
    {
      name: "tsun.store.v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        mood: s.mood,
        lastMoodAt: s.lastMoodAt,
        relationship: s.relationship,
        score: s.score,
        interactionCount: s.interactionCount,
        currentQuote: s.currentQuote,
        bootCompressed: s.bootCompressed,
        marketAlertsMuted: s.marketAlertsMuted,
        charAlertsMuted: s.charAlertsMuted,
        soundOn: s.soundOn,
        reducedMotion: s.reducedMotion,
        unlockedFiles: s.unlockedFiles,
        user: s.user,
        athMarketCap: s.athMarketCap,
      }),
    },
  ),
);

function createLazyMilestones(): Milestone[] {
  // loadMilestoneState is client guarded; on the server this returns locked set.
  try {
    return loadMilestoneState();
  } catch {
    return [];
  }
}

/** Rehydrate persisted state on the client. Call once in a client effect. */
export function rehydrateTsunStore(): void {
  try {
    void useTsunStore.persist.rehydrate();
  } catch {
    /* ignore */
  }
}
