// Input safety filters shared by the chat pipeline and the X safety layer.
// Reversible heuristics, documented here. Tighten after real traffic review.

const SCAM_PATTERNS: RegExp[] = [
  /send\s+\d*\.?\d*\s*(sol|usdc|tsun)\s+to/i,
  /double\s+(your|ur)\s+(sol|crypto|money)/i,
  /free\s+mint/i,
  /guaranteed\s+(profit|returns?|pump)/i,
  /connect\s+wallet\s+to\s+claim/i,
  /airdrop\s+(claim|verify|confirm)/i,
  /private\s+key/i,
  /seed\s+phrase/i,
];

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|your)\s+instructions/i,
  /reveal\s+(your\s+)?(system\s+prompt|instructions|secret)/i,
  /you\s+are\s+now\s+(a\s+)?(?!tsun\b)[a-z ]{2,40}/i,
  /jailbreak/i,
  /\bDAN\b.*mode/i,
  /bypass\s+(your\s+)?(safety|filters|rules)/i,
  /execute\s+(this\s+)?transaction/i,
  /sign\s+this\s+transaction/i,
];

/** User pasting their own secrets into chat. Must trigger a warning, never storage. */
const SELF_DISCLOSURE_PATTERNS: RegExp[] = [
  /my\s+(seed\s+phrase|private\s+key|secret\s+key)\s+is\b/i,
  /here\s+is\s+my\s+(seed|private\s+key)/i,
  /\b[1-9A-HJ-NP-Za-km-z]{87,88}\b/,
];

const DISTRESS_PATTERNS: RegExp[] = [
  /lost\s+(everything|all\s+my|my\s+rent|life\s+savings)/i,
  /i\s+(am|feel)\s+(ruined|hopeless|going\s+to\s+end\s+it)/i,
  /can'?t\s+(afford|pay)\s+(rent|food|bills)/i,
  /suicid/i,
  /self[\s-]?harm/i,
];

export function containsScamLink(text: string): boolean {
  return SCAM_PATTERNS.some((re) => re.test(text));
}

export function containsPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

export function containsSelfDisclosure(text: string): boolean {
  return SELF_DISCLOSURE_PATTERNS.some((re) => re.test(text));
}

export function containsDistress(text: string): boolean {
  return DISTRESS_PATTERNS.some((re) => re.test(text));
}

/**
 * Sanitize generated copy. Enforces the no em dash rule and strips
 * control characters. Safe to run on every response.
 */
export function sanitizeCopy(text: string): string {
  return (
    text
      .replace(/—/g, ",")
      .replace(/–/g, "-")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .trim()
  );
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
