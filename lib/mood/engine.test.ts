import { describe, expect, it } from "vitest";
import { MOOD_THRESHOLDS, resolveMood, shouldApplyMood } from "@/lib/mood/engine";

describe("mood engine", () => {
  it("resolves SMUG on a 20%+ pump", () => {
    expect(resolveMood({ tsunChange24h: 0.31 }).mood).toBe("SMUG");
  });

  it("resolves ANNOYED on a 20%+ dump", () => {
    expect(resolveMood({ tsunChange24h: -0.27 }).mood).toBe("ANNOYED");
  });

  it("resolves PANICKING on a 40%+ crash", () => {
    expect(resolveMood({ tsunChange24h: -0.45 }).mood).toBe("PANICKING");
  });

  it("resolves EMBARRASSED on 15%+ drawdown", () => {
    expect(resolveMood({ portfolioDrawdown: 0.18 }).mood).toBe("EMBARRASSED");
  });

  it("resolves FURIOUS on 35%+ drawdown", () => {
    expect(resolveMood({ portfolioDrawdown: 0.4 }).mood).toBe("FURIOUS");
  });

  it("resolves FLUSTERED on compliment, DERE when unlocked", () => {
    expect(resolveMood({ userCompliment: true }).mood).toBe("FLUSTERED");
    expect(resolveMood({ userCompliment: true, dereUnlocked: true }).mood).toBe("DERE");
  });

  it("resolves HAPPY on milestone", () => {
    expect(resolveMood({ milestoneReached: true }).mood).toBe("HAPPY");
  });

  it("forces NORMAL on serious distress, regardless of triggers", () => {
    expect(resolveMood({ seriousDistress: true, tsunChange24h: 0.5, userMockery: true }).mood).toBe("NORMAL");
  });

  it("applies deterministic priority on collisions (FURIOUS beats SMUG)", () => {
    expect(resolveMood({ tsunChange24h: 0.3, portfolioDrawdown: 0.4 }).mood).toBe("FURIOUS");
  });

  it("defaults to NORMAL with no signals", () => {
    expect(resolveMood({}).mood).toBe("NORMAL");
  });

  it("ignores NaN and null inputs", () => {
    expect(resolveMood({ tsunChange24h: NaN, portfolioDrawdown: null }).mood).toBe("NORMAL");
  });

  it("escalation bypasses cooldown, lateral moves respect it", () => {
    const now = 1_000_000;
    expect(shouldApplyMood("ANNOYED", "FURIOUS", now - 1000, now)).toBe(true);
    expect(shouldApplyMood("SMUG", "HAPPY", now - 1000, now)).toBe(false);
    expect(shouldApplyMood("SMUG", "HAPPY", now - 200_000, now)).toBe(true);
    expect(shouldApplyMood("SMUG", "SMUG", now - 999_999, now)).toBe(false);
  });

  it("keeps thresholds configurable", () => {
    expect(MOOD_THRESHOLDS.smugPump).toBe(0.2);
  });
});
