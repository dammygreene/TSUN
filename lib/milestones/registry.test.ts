import { describe, expect, it } from "vitest";
import { createLockedMilestones, evaluateMilestones } from "@/lib/milestones/registry";

describe("milestone engine", () => {
  it("unlocks thresholds at or below ATH", () => {
    const { state, newlyUnlocked } = evaluateMilestones(260_000, createLockedMilestones(), "2026-01-01T00:00:00.000Z");
    const unlocked = state.filter((m) => m.status === "UNLOCKED").map((m) => m.id);
    expect(unlocked).toEqual(["m50k", "m100k", "m250k"]);
    expect(newlyUnlocked.map((m) => m.id)).toEqual(["m50k", "m100k", "m250k"]);
    expect(state[0].reachedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(state[0].marketCapAtTrigger).toBe(260_000);
  });

  it("is idempotent: duplicate triggers unlock nothing new", () => {
    const first = evaluateMilestones(1_000_000, createLockedMilestones());
    const second = evaluateMilestones(1_000_000, first.state);
    expect(second.newlyUnlocked).toEqual([]);
    expect(second.state.filter((m) => m.status === "UNLOCKED")).toHaveLength(5);
  });

  it("never relocks when market cap falls", () => {
    const first = evaluateMilestones(600_000, createLockedMilestones());
    const second = evaluateMilestones(40_000, first.state);
    expect(second.newlyUnlocked).toEqual([]);
    expect(second.state.filter((m) => m.status === "UNLOCKED")).toHaveLength(4);
  });

  it("handles null ATH without unlocking", () => {
    const { state, newlyUnlocked } = evaluateMilestones(null, createLockedMilestones());
    expect(newlyUnlocked).toEqual([]);
    expect(state.every((m) => m.status === "LOCKED")).toBe(true);
  });
});
