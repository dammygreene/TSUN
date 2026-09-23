// Event-based relationship engine. Internal score stays hidden,
// UI exposes only the named level. Affection is never purchasable:
// no event awards points for token ownership or spending.

import type { RelationshipLevel } from "@/types/tsun";

export const RELATIONSHIP_LEVELS: { level: RelationshipLevel; minScore: number }[] = [
  { level: "STRANGER", minScore: 0 },
  { level: "ANNOYING TRADER", minScore: 5 },
  { level: "REGULAR", minScore: 15 },
  { level: "TOLERABLE HUMAN", minScore: 35 },
  { level: "FAVORITE DEGEN", minScore: 70 },
  { level: "DERE", minScore: 120 },
];

export type RelationshipEventKind =
  | "message"
  | "return_visit"
  | "meaningful"
  | "compliment"
  | "mockery"
  | "wallet_connect"
  | "milestone_shared";

const POINTS: Record<RelationshipEventKind, number> = {
  message: 1,
  return_visit: 3,
  meaningful: 2,
  compliment: 1,
  // She respects spine. Mockery still counts as attention, which she craves.
  mockery: 1,
  wallet_connect: 2,
  milestone_shared: 2,
};

export function pointsFor(kind: RelationshipEventKind): number {
  return POINTS[kind];
}

export function levelForScore(score: number): RelationshipLevel {
  const s = Math.max(0, Math.floor(score));
  let current: RelationshipLevel = "STRANGER";
  for (const entry of RELATIONSHIP_LEVELS) {
    if (s >= entry.minScore) current = entry.level;
  }
  return current;
}

export interface RelationshipTransition {
  score: number;
  level: RelationshipLevel;
  prevLevel: RelationshipLevel;
  leveledUp: boolean;
  pointsAwarded: number;
}

export function applyRelationshipEvent(
  prevScore: number,
  kind: RelationshipEventKind,
): RelationshipTransition {
  const prevLevel = levelForScore(prevScore);
  const pointsAwarded = pointsFor(kind);
  const score = Math.max(0, prevScore + pointsAwarded);
  const level = levelForScore(score);
  return { score, level, prevLevel, leveledUp: level !== prevLevel, pointsAwarded };
}

/** Greeting flavor per level. Rare affection stays rare. */
export const RELATIONSHIP_GREETING: Record<RelationshipLevel, string> = {
  STRANGER: "Who the hell are you? State your business or leave.",
  "ANNOYING TRADER": "Oh. You again. Try to be less wrong today.",
  REGULAR: "Oh. You again. Did you actually listen to me this time?",
  "TOLERABLE HUMAN": "Back again. I suppose your persistence is almost admirable. Almost.",
  "FAVORITE DEGEN": "You are an idiot, but at least you are predictable. Sit down.",
  DERE: "You disappeared yesterday. Not that I noticed. The chat was just quieter.",
};
