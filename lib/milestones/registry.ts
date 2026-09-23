// Milestone engine: ATH market cap thresholds. Unlocks are permanent and
// idempotent. A milestone once UNLOCKED never relocks when price falls.
// Persistence: localStorage on the client, Postgres in production (schema.sql).

import type { Milestone } from "@/types/tsun";

export interface MilestoneDef {
  id: string;
  targetMarketCap: number;
  title: string;
  dialogueUnlock: string;
  personalityUnlock: string;
  visualUnlock: string;
}

export const MILESTONE_DEFS: MilestoneDef[] = [
  { id: "m50k", targetMarketCap: 50_000, title: "$50K", dialogueUnlock: "Acknowledges the chart exists", personalityUnlock: "Slightly less murderous mornings", visualUnlock: "Terminal accent trim" },
  { id: "m100k", targetMarketCap: 100_000, title: "$100K", dialogueUnlock: "Acknowledges the community", personalityUnlock: "Backhanded gratitude enabled", visualUnlock: "Smug avatar state" },
  { id: "m250k", targetMarketCap: 250_000, title: "$250K", dialogueUnlock: "More personalized dialogue", personalityUnlock: "Remembers your bad habits", visualUnlock: "Commentary panel upgrade" },
  { id: "m500k", targetMarketCap: 500_000, title: "$500K", dialogueUnlock: "Victory laps permitted", personalityUnlock: "Wider emotional range", visualUnlock: "New visual state" },
  { id: "m1m", targetMarketCap: 1_000_000, title: "$1M", dialogueUnlock: "Flirty dialogue becomes possible", personalityUnlock: "Rare softness unlocked", visualUnlock: "Milestone avatar frame" },
  { id: "m2_5m", targetMarketCap: 2_500_000, title: "$2.5M", dialogueUnlock: "Story arcs reference holders", personalityUnlock: "Protective of regulars", visualUnlock: "Times front page treatment" },
  { id: "m5m", targetMarketCap: 5_000_000, title: "$5M", dialogueUnlock: "DERE mode becomes possible", personalityUnlock: "Genuine affection, well hidden", visualUnlock: "DERE visual state" },
  { id: "m10m", targetMarketCap: 10_000_000, title: "$10M", dialogueUnlock: "Major final character evolution", personalityUnlock: "Full emotional range", visualUnlock: "Legendary avatar state" },
];

export function createLockedMilestones(): Milestone[] {
  return MILESTONE_DEFS.map((d) => ({
    id: d.id,
    targetMarketCap: d.targetMarketCap,
    status: "LOCKED",
    reachedAt: null,
    marketCapAtTrigger: null,
    title: d.title,
    dialogueUnlock: d.dialogueUnlock,
    personalityUnlock: d.personalityUnlock,
    visualUnlock: d.visualUnlock,
    artworkUrl: null,
    postId: null,
  }));
}

export interface MilestoneEvaluation {
  state: Milestone[];
  newlyUnlocked: Milestone[];
}

/**
 * Pure evaluation: given ATH market cap and current state, return the next
 * state plus any newly unlocked milestones. Idempotent and never relocks.
 */
export function evaluateMilestones(
  athMarketCap: number | null | undefined,
  current: Milestone[],
  nowIso?: string,
): MilestoneEvaluation {
  const now = nowIso ?? new Date().toISOString();
  const byId = new Map(current.map((m) => [m.id, m]));
  const state: Milestone[] = [];
  const newlyUnlocked: Milestone[] = [];
  for (const def of MILESTONE_DEFS) {
    const prev = byId.get(def.id);
    if (prev?.status === "UNLOCKED") {
      state.push(prev);
      continue;
    }
    if (typeof athMarketCap === "number" && Number.isFinite(athMarketCap) && athMarketCap >= def.targetMarketCap) {
      const unlocked: Milestone = {
        id: def.id,
        targetMarketCap: def.targetMarketCap,
        status: "UNLOCKED",
        reachedAt: now,
        marketCapAtTrigger: athMarketCap,
        title: def.title,
        dialogueUnlock: def.dialogueUnlock,
        personalityUnlock: def.personalityUnlock,
        visualUnlock: def.visualUnlock,
        artworkUrl: null,
        postId: null,
      };
      state.push(unlocked);
      newlyUnlocked.push(unlocked);
    } else {
      state.push(
        prev ?? {
          id: def.id,
          targetMarketCap: def.targetMarketCap,
          status: "LOCKED",
          reachedAt: null,
          marketCapAtTrigger: null,
          title: def.title,
          dialogueUnlock: def.dialogueUnlock,
          personalityUnlock: def.personalityUnlock,
          visualUnlock: def.visualUnlock,
          artworkUrl: null,
          postId: null,
        },
      );
    }
  }
  return { state, newlyUnlocked };
}

const STORE_KEY = "tsun.milestones.v1";

export function loadMilestoneState(): Milestone[] {
  if (typeof window === "undefined") return createLockedMilestones();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return createLockedMilestones();
    const parsed = JSON.parse(raw) as Milestone[];
    if (!Array.isArray(parsed)) return createLockedMilestones();
    // Reconcile with defs so new milestones survive deploys, keep unlocks.
    const { state } = evaluateMilestones(null, parsed);
    return state;
  } catch {
    return createLockedMilestones();
  }
}

export function saveMilestoneState(state: Milestone[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
