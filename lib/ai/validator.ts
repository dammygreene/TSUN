// Truth guard: validates generated copy against tool supplied facts.
// Any financial-looking number must be traceable to a fact value.
// Unsupported claims fail closed to a safe fallback. No em dashes in copy.

import { sanitizeCopy } from "@/lib/security/filters";

/** Matches $ amounts and percentages, with optional K/M/B magnitude. */
const FINANCIAL_NUMBER_RE = /(\$[\d,]+(?:\.\d+)?\s*[KMBkmb]?)|([\d,]+(?:\.\d+)?\s*%)/g;
const TX_HASH_RE = /\b[1-9A-HJ-NP-Za-km-z]{64,88}\b/;

function parseFinancialToken(token: string): number | null {
  let t = token.trim().replace(/,/g, "");
  let mult = 1;
  const mag = t.match(/([KMBkmb])$/);
  if (mag) {
    const m = mag[1].toUpperCase();
    mult = m === "K" ? 1_000 : m === "M" ? 1_000_000 : 1_000_000_000;
    t = t.slice(0, -1).trim();
  }
  const isPct = t.endsWith("%");
  if (isPct) t = t.slice(0, -1).trim();
  if (t.startsWith("$")) t = t.slice(1);
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return isPct ? n / 100 : n * mult;
}

/** Recursively collect every finite number from a facts object. */
export function collectFactNumbers(facts: unknown, out: number[] = []): number[] {
  if (typeof facts === "number" && Number.isFinite(facts)) {
    out.push(facts);
    return out;
  }
  if (Array.isArray(facts)) {
    for (const v of facts) collectFactNumbers(v, out);
    return out;
  }
  if (facts && typeof facts === "object") {
    for (const v of Object.values(facts as Record<string, unknown>)) collectFactNumbers(v, out);
  }
  return out;
}

/** Collect strings (tx signatures etc.) so quoted identifiers can be verified. */
export function collectFactStrings(facts: unknown, out: string[] = []): string[] {
  if (typeof facts === "string") {
    out.push(facts);
    return out;
  }
  if (Array.isArray(facts)) {
    for (const v of facts) collectFactStrings(v, out);
    return out;
  }
  if (facts && typeof facts === "object") {
    for (const v of Object.values(facts as Record<string, unknown>)) collectFactStrings(v, out);
  }
  return out;
}

function matchesFactNumber(value: number, facts: number[]): boolean {
  return facts.some((f) => {
    if (f === 0) return Math.abs(value) < 1e-9;
    const rel = Math.abs(value - f) / Math.max(Math.abs(f), 1e-12);
    // Percentages in copy are fractions here; allow rounding slack.
    return rel <= 0.02 || Math.abs(value - f) <= Math.max(1e-9, Math.abs(f) * 0.02);
  });
}

export interface ValidationInput {
  text: string;
  facts: unknown;
}

export interface ValidationResult {
  ok: boolean;
  violations: string[];
  sanitized: string;
}

export function validateResponse(input: ValidationInput): ValidationResult {
  const sanitized = sanitizeCopy(input.text);
  const violations: string[] = [];
  const factNumbers = collectFactNumbers(input.facts);
  const factStrings = collectFactStrings(input.facts);

  FINANCIAL_NUMBER_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FINANCIAL_NUMBER_RE.exec(sanitized)) !== null) {
    const value = parseFinancialToken(m[0]);
    if (value === null) continue;
    if (!matchesFactNumber(value, factNumbers)) {
      violations.push(`unsupported financial figure "${m[0].trim()}"`);
    }
  }

  TX_HASH_RE.lastIndex = 0;
  const hashMatch = sanitized.match(TX_HASH_RE);
  if (hashMatch && !factStrings.includes(hashMatch[0])) {
    violations.push("unsupported transaction hash");
  }

  return { ok: violations.length === 0, violations, sanitized };
}

/** Safe fallback when validation fails. States the failure, never guesses. */
export function truthGuardFallback(reason: string): string {
  return (
    `My truth guard blocked that draft (${reason}). FACT STATUS: UNAVAILABLE ` +
    "for the disputed figure. I refuse to guess. Ask again or check the terminal."
  );
}
