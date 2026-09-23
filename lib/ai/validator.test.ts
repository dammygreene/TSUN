import { describe, expect, it } from "vitest";
import { truthGuardFallback, validateResponse } from "@/lib/ai/validator";

const facts = {
  sol: { priceUsd: 212.31, change24h: 0.0472 },
  portfolio: { totalPnlPct: -14.2 },
};

describe("truth guard", () => {
  it("passes faithful figures", () => {
    const r = validateResponse({ text: "SOL: $212.31 (+4.72% 24h).", facts });
    expect(r.ok).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it("flags fabricated prices", () => {
    const r = validateResponse({ text: "SOL is at $999.99 today.", facts });
    expect(r.ok).toBe(false);
    expect(r.violations[0]).toMatch("unsupported financial figure");
  });

  it("flags fabricated percentages", () => {
    const r = validateResponse({ text: "We are up +250% on the day.", facts });
    expect(r.ok).toBe(false);
  });

  it("passes unavailable states with no figures", () => {
    const r = validateResponse({
      text: "FACT STATUS: UNAVAILABLE for SOL. I refuse to invent the number.",
      facts: {},
    });
    expect(r.ok).toBe(true);
  });

  it("flags unsupported transaction hashes", () => {
    const fake = "4".repeat(64);
    const r = validateResponse({ text: `See tx ${fake} for proof.`, facts });
    expect(r.ok).toBe(false);
    expect(r.violations[0]).toMatch("transaction hash");
  });

  it("accepts tx hashes present in facts", () => {
    const sig = "5".repeat(88);
    const r = validateResponse({ text: `See tx ${sig}.`, facts: { trades: [{ txSignature: sig }] } });
    expect(r.ok).toBe(true);
  });

  it("sanitizes em dashes from copy", () => {
    const r = validateResponse({ text: "Hello — trader.", facts: {} });
    expect(r.sanitized).not.toContain("—");
  });

  it("fallback never contains figures", () => {
    const fb = truthGuardFallback("unsupported financial figure");
    expect(fb).toMatch("FACT STATUS: UNAVAILABLE");
    expect(validateResponse({ text: fb, facts: {} }).ok).toBe(true);
  });
});
