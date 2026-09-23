// Audit log for external actions. Every tool call and chat turn is recorded.
// Ring buffer in memory for the MVP (queryable in tests), structured JSON to
// stdout for log collectors. Moves to the tool_calls table with Postgres.

export interface AuditEntry {
  at: string;
  tool: string;
  ok: boolean;
  source: string;
  error?: string;
  key?: string;
}

const RING_MAX = 200;
const ring: AuditEntry[] = [];

export function audit(entry: Omit<AuditEntry, "at">): void {
  const full: AuditEntry = { ...entry, at: new Date().toISOString() };
  ring.push(full);
  if (ring.length > RING_MAX) ring.splice(0, ring.length - RING_MAX);
  try {
    console.log(JSON.stringify({ audit: true, ...full }));
  } catch {
    /* logging must never break the request */
  }
}

export function auditToolCall(tool: string, ok: boolean, source: string, error?: string, key?: string): void {
  audit({ tool, ok, source, error, key });
}

/** Test hook. */
export function __auditRing(): AuditEntry[] {
  return [...ring];
}

/** Test hook. */
export function __clearAudit(): void {
  ring.length = 0;
}
