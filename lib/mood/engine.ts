// Deterministic mood engine. Pure functions, no I/O, fully tested.
// Mood affects wording and visuals. It never overrides truth or safety.

import type { TsunMood } from "@/types/tsun";

/**
 * Priority order for event collisions. Highest priority first.
 * DERE placement is deliberate: it is a sticky, relationship-earned state
 * that yields only to genuine rage or panic, and overrides momentary
 * market-driven smugness. DERE can only trigger when dereUnlocked is true.
 */
export const MOOD_PRIORITY: TsunMood[] = [
  "FURIOUS",
  "PANICKING",
  "ANGRY",
  "DERE",
  "EMBARRASSED",
  "FLUSTERED",
  "SMUG",
  "HAPPY",
  "ANNOYED",
  "NORMAL",
];

export const MOOD_THRESHOLDS = {
  /** TSUN 24h change that triggers SMUG. */
  smugPump: 0.2,
  /** TSUN 24h change that triggers ANNOYED. */
  annoyedDump: -0.2,
  /** TSUN 24h change that triggers PANICKING. */
  panicDump: -0.4,
  /** Portfolio drawdown (0.15 = 15%) that triggers EMBARRASSED. */
  drawdownEmbarrassed: 0.15,
  /** Portfolio drawdown that triggers FURIOUS. */
  drawdownFurious: 0.35,
  /** Portfolio single-day surge that triggers SMUG. */
  portfolioSurge: 0.25,
} as const;

/** Minimum time a mood sticks before a lower-priority mood may replace it. */
export const MOOD_COOLDOWNS_MS: Record<TsunMood, number> = {
  FURIOUS: 0,
  PANICKING: 0,
  ANGRY: 30_000,
  DERE: 300_000,
  EMBARRASSED: 60_000,
  FLUSTERED: 60_000,
  SMUG: 120_000,
  HAPPY: 120_000,
  ANNOYED: 60_000,
  NORMAL: 30_000,
};

export interface MoodSignals {
  tsunChange24h?: number | null;
  /** Drawdown as a positive fraction, e.g. 0.18 means down 18% from peak. */
  portfolioDrawdown?: number | null;
  portfolioSurged?: boolean;
  userCompliment?: boolean;
  userMockery?: boolean;
  milestoneReached?: boolean;
  repeatedQuestion?: boolean;
  /** User discussing hardship. Forces calm seriousness, handled in copy layer. */
  seriousDistress?: boolean;
  /** True when relationship is DERE-earned and the moment allows softness. */
  dereUnlocked?: boolean;
  userReturned?: boolean;
}

export interface MoodResolution {
  mood: TsunMood;
  reasons: string[];
}

/** Pure deterministic resolution. Same signals always yield the same mood. */
export function resolveMood(signals: MoodSignals): MoodResolution {
  if (signals.seriousDistress) {
    return { mood: "NORMAL", reasons: ["serious user context forces calm"] };
  }

  const candidates: { mood: TsunMood; reason: string }[] = [];
  const t = MOOD_THRESHOLDS;

  const chg = signals.tsunChange24h;
  if (typeof chg === "number" && Number.isFinite(chg)) {
    if (chg >= t.smugPump) candidates.push({ mood: "SMUG", reason: `tsun up ${(chg * 100).toFixed(1)}%` });
    if (chg <= t.panicDump) candidates.push({ mood: "PANICKING", reason: `tsun down ${(chg * 100).toFixed(1)}%` });
    else if (chg <= t.annoyedDump) candidates.push({ mood: "ANNOYED", reason: `tsun down ${(chg * 100).toFixed(1)}%` });
  }

  const dd = signals.portfolioDrawdown;
  if (typeof dd === "number" && Number.isFinite(dd) && dd > 0) {
    if (dd >= t.drawdownFurious) candidates.push({ mood: "FURIOUS", reason: `drawdown ${(dd * 100).toFixed(1)}%` });
    else if (dd >= t.drawdownEmbarrassed) candidates.push({ mood: "EMBARRASSED", reason: `drawdown ${(dd * 100).toFixed(1)}%` });
  }
  if (signals.portfolioSurged) candidates.push({ mood: "SMUG", reason: "portfolio surge" });
  if (signals.milestoneReached) candidates.push({ mood: "HAPPY", reason: "milestone reached" });
  if (signals.userCompliment) {
    candidates.push({
      mood: signals.dereUnlocked ? "DERE" : "FLUSTERED",
      reason: signals.dereUnlocked ? "compliment at max affection" : "user compliment",
    });
  }
  if (signals.userReturned && signals.dereUnlocked) {
    candidates.push({ mood: "DERE", reason: "favorite user returned" });
  }
  if (signals.userMockery) candidates.push({ mood: "ANGRY", reason: "user mockery" });
  if (signals.repeatedQuestion) candidates.push({ mood: "ANNOYED", reason: "repeated question" });

  if (candidates.length === 0) return { mood: "NORMAL", reasons: ["no triggers"] };

  candidates.sort((a, b) => MOOD_PRIORITY.indexOf(a.mood) - MOOD_PRIORITY.indexOf(b.mood));
  const winner = candidates[0];
  return {
    mood: winner.mood,
    reasons: candidates.filter((c) => c.mood === winner.mood).map((c) => c.reason),
  };
}

/**
 * Cooldown gate so mood does not flicker. Escalation to a higher-priority
 * mood always applies immediately. Lateral or downward moves respect the
 * previous mood cooldown window.
 */
export function shouldApplyMood(
  prev: TsunMood,
  next: TsunMood,
  lastChangedAtMs: number,
  nowMs: number,
): boolean {
  if (next === prev) return false;
  const prevRank = MOOD_PRIORITY.indexOf(prev);
  const nextRank = MOOD_PRIORITY.indexOf(next);
  if (nextRank < prevRank) return true;
  const cooldown = MOOD_COOLDOWNS_MS[prev] ?? 60_000;
  return nowMs - lastChangedAtMs >= cooldown;
}

/** Short status line per mood for the OS shell. No em dashes allowed. */
export const MOOD_STATUS_LINE: Record<TsunMood, string> = {
  NORMAL: "Monitoring. Unfortunately, you are here.",
  ANNOYED: "Tolerating your presence. Barely.",
  ANGRY: "Do not test me today.",
  FURIOUS: "Everyone is fired, starting with you.",
  SMUG: "Correct, as usual. The market finally agrees.",
  EMBARRASSED: "Do NOT look at the numbers. Look away.",
  FLUSTERED: "What. Say that again. I dare you.",
  HAPPY: "Fine. Today is acceptable. Do not ruin it.",
  PANICKING: "This is fine. Everything is fine. It is NOT fine.",
  DERE: "You came back. Not that I was counting the minutes.",
};
