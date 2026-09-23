import { describe, expect, it } from "vitest";
import { applyRelationshipEvent, levelForScore } from "@/lib/relationship/engine";

describe("relationship engine", () => {
  it("maps scores to named levels only", () => {
    expect(levelForScore(0)).toBe("STRANGER");
    expect(levelForScore(5)).toBe("ANNOYING TRADER");
    expect(levelForScore(15)).toBe("REGULAR");
    expect(levelForScore(35)).toBe("TOLERABLE HUMAN");
    expect(levelForScore(70)).toBe("FAVORITE DEGEN");
    expect(levelForScore(120)).toBe("DERE");
    expect(levelForScore(999)).toBe("DERE");
    expect(levelForScore(-10)).toBe("STRANGER");
  });

  it("awards points per event and reports level ups", () => {
    const t = applyRelationshipEvent(14, "message");
    expect(t.score).toBe(15);
    expect(t.level).toBe("REGULAR");
    expect(t.leveledUp).toBe(true);
    expect(t.prevLevel).toBe("ANNOYING TRADER");
  });

  it("does not level up below thresholds", () => {
    const t = applyRelationshipEvent(0, "message");
    expect(t.leveledUp).toBe(false);
    expect(t.level).toBe("STRANGER");
  });

  it("values return visits highly", () => {
    const t = applyRelationshipEvent(0, "return_visit");
    expect(t.pointsAwarded).toBe(3);
  });
});
