// Optional env gated LLM adapter. Default provider is "none", which keeps the
// deterministic local engine. When a provider is configured, chat drafts via
// the LLM and the result STILL passes the truth guard before reaching the user.
// Only derived public context is ever sent. No keys, no wallet data, no secrets.

import type { ToolResult } from "@/types/tsun";

const LLM_TIMEOUT_MS = 15_000;
const MAX_DRAFT_CHARS = 1200;

export interface LlmDraftInput {
  systemPrompt: string;
  history: { role: "user" | "assistant"; text: string }[];
  userMessage: string;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<{ status: number; json: unknown }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json: unknown = await res.json().catch(() => null);
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

function fail(source: string, error: string): ToolResult<string> {
  return { ok: false, error, fetchedAt: new Date().toISOString(), source };
}

async function draftOpenAI(input: LlmDraftInput, apiKey: string): Promise<ToolResult<string>> {
  const source = "OpenAI";
  try {
    const { status, json } = await postJson(
      "https://api.openai.com/v1/chat/completions",
      { authorization: `Bearer ${apiKey}` },
      {
        model: "gpt-4o-mini",
        max_tokens: 400,
        temperature: 0.9,
        messages: [
          { role: "system", content: input.systemPrompt },
          ...input.history.slice(-8).map((m) => ({ role: m.role, content: m.text.slice(0, 800) })),
          { role: "user", content: input.userMessage },
        ],
      },
    );
    const text = (json as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content;
    if (status !== 200 || typeof text !== "string" || !text.trim()) {
      return fail(source, status === 429 ? "RATE_LIMITED" : "PROVIDER_ERROR");
    }
    return { ok: true, data: text.slice(0, MAX_DRAFT_CHARS), fetchedAt: new Date().toISOString(), source };
  } catch (err) {
    return fail(source, err instanceof Error && err.name === "AbortError" ? "TIMEOUT" : "FETCH_FAILED");
  }
}

async function draftAnthropic(input: LlmDraftInput, apiKey: string): Promise<ToolResult<string>> {
  const source = "Anthropic";
  try {
    const { status, json } = await postJson(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      {
        model: "claude-3-5-haiku-latest",
        max_tokens: 400,
        system: input.systemPrompt,
        messages: [
          ...input.history.slice(-8).map((m) => ({ role: m.role, content: m.text.slice(0, 800) })),
          { role: "user", content: input.userMessage },
        ],
      },
    );
    const blocks = (json as { content?: { type?: string; text?: string }[] })?.content;
    const text = blocks?.find((b) => b.type === "text")?.text;
    if (status !== 200 || typeof text !== "string" || !text.trim()) {
      return fail(source, status === 429 ? "RATE_LIMITED" : "PROVIDER_ERROR");
    }
    return { ok: true, data: text.slice(0, MAX_DRAFT_CHARS), fetchedAt: new Date().toISOString(), source };
  } catch (err) {
    return fail(source, err instanceof Error && err.name === "AbortError" ? "TIMEOUT" : "FETCH_FAILED");
  }
}

export function llmProviderName(): string {
  // Read env lazily so tests and runtime reconfiguration see current values.
  return process.env.TSUN_LLM_PROVIDER ?? "none";
}

/** Draft a reply with the configured provider. Returns ok:false when disabled. */
export async function generateLlmDraft(input: LlmDraftInput): Promise<ToolResult<string>> {
  const provider = llmProviderName();
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY ?? "";
    if (!key) return fail("OpenAI", "NOT_CONFIGURED");
    return draftOpenAI(input, key);
  }
  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY ?? "";
    if (!key) return fail("Anthropic", "NOT_CONFIGURED");
    return draftAnthropic(input, key);
  }
  return fail("none", "DISABLED");
}
