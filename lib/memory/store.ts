// Memory layers: short term (recent messages, client), medium term (summaries),
// long term (persistent UserMemory). Storage is abstracted so Postgres can
// replace the adapters later without touching callers. Schema: lib/database/schema.sql.

import type { ChatMessage, UserMemory } from "@/types/tsun";
import { levelForScore } from "@/lib/relationship/engine";

const MEMORY_KEY = "tsun.memory.v1";
const CHAT_KEY = "tsun.conversation.v1";
const MAX_NOTES = 20;
const MAX_SUMMARIES = 10;
const MAX_CHAT_PERSIST = 100;

export function newUserId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `user_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function createDefaultMemory(userId: string, nowIso?: string): UserMemory {
  const now = nowIso ?? new Date().toISOString();
  return {
    userId,
    relationship: "STRANGER",
    score: 0,
    interactionCount: 0,
    firstSeenAt: now,
    lastSeenAt: now,
    discussedAssets: [],
    summaries: [],
    notes: [],
  };
}

function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked, memory simply does not persist */
  }
}

export function loadMemory(): UserMemory | null {
  const raw = readLocal(MEMORY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UserMemory;
    if (!parsed || typeof parsed.userId !== "string") return null;
    return { ...createDefaultMemory(parsed.userId), ...parsed };
  } catch {
    return null;
  }
}

export function saveMemory(memory: UserMemory): void {
  writeLocal(MEMORY_KEY, JSON.stringify(memory));
}

export function getOrCreateMemory(): UserMemory {
  const existing = loadMemory();
  if (existing) return existing;
  const fresh = createDefaultMemory(newUserId());
  saveMemory(fresh);
  return fresh;
}

/** Record one interaction. Pure on the passed object, returns a new object. */
export function recordInteraction(
  memory: UserMemory,
  opts: { topics?: string[]; score?: number; nowIso?: string } = {},
): UserMemory {
  const now = opts.nowIso ?? new Date().toISOString();
  const score = typeof opts.score === "number" ? opts.score : memory.score;
  const topics = opts.topics ?? [];
  const discussedAssets = [...memory.discussedAssets];
  for (const t of topics) {
    const sym = t.trim().toUpperCase().slice(0, 12);
    if (sym && !discussedAssets.includes(sym)) discussedAssets.push(sym);
  }
  return {
    ...memory,
    score,
    relationship: levelForScore(score),
    interactionCount: memory.interactionCount + 1,
    lastSeenAt: now,
    discussedAssets: discussedAssets.slice(-12),
  };
}

export function addMemoryNote(memory: UserMemory, note: string): UserMemory {
  const clean = note.trim().slice(0, 200);
  if (!clean || memory.notes.includes(clean)) return memory;
  return { ...memory, notes: [...memory.notes, clean].slice(-MAX_NOTES) };
}

export function addMemorySummary(memory: UserMemory, summary: string): UserMemory {
  const clean = summary.trim().slice(0, 300);
  if (!clean) return memory;
  return { ...memory, summaries: [...memory.summaries, clean].slice(-MAX_SUMMARIES) };
}

// Short term conversation persistence (client side).
export function loadConversation(): ChatMessage[] {
  const raw = readLocal(CHAT_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m) => m && typeof m.text === "string").slice(-MAX_CHAT_PERSIST);
  } catch {
    return [];
  }
}

export function saveConversation(messages: ChatMessage[]): void {
  writeLocal(CHAT_KEY, JSON.stringify(messages.slice(-MAX_CHAT_PERSIST)));
}

// Minimal server side conversation store. In memory by design for the MVP
// sandbox (no database available). Replace with Postgres per schema.sql.
const serverConversations = new Map<string, ChatMessage[]>();

export function serverAppendMessages(userId: string, messages: ChatMessage[]): void {
  const prev = serverConversations.get(userId) ?? [];
  serverConversations.set(userId, [...prev, ...messages].slice(-MAX_CHAT_PERSIST));
}

export function serverGetMessages(userId: string): ChatMessage[] {
  return serverConversations.get(userId) ?? [];
}
