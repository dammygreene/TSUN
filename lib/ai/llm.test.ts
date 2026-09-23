import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateLlmDraft } from "@/lib/ai/llm";

const input = { systemPrompt: "You are TSUN.", history: [], userMessage: "hi" };

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("llm adapter", () => {
  it("stays disabled by default", async () => {
    vi.stubEnv("TSUN_LLM_PROVIDER", "none");
    const r = await generateLlmDraft(input);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("DISABLED");
  });

  it("drafts via OpenAI when configured", async () => {
    vi.stubEnv("TSUN_LLM_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "Obviously." } }] }), { status: 200 })),
    );
    const r = await generateLlmDraft(input);
    expect(r.ok).toBe(true);
    expect(r.data).toBe("Obviously.");
    expect(r.source).toBe("OpenAI");
  });

  it("drafts via Anthropic when configured", async () => {
    vi.stubEnv("TSUN_LLM_PROVIDER", "anthropic");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ content: [{ type: "text", text: "What." }] }), { status: 200 })),
    );
    const r = await generateLlmDraft(input);
    expect(r.ok).toBe(true);
    expect(r.data).toBe("What.");
  });

  it("fails closed on provider errors", async () => {
    vi.stubEnv("TSUN_LLM_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    const r = await generateLlmDraft(input);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("PROVIDER_ERROR");
  });

  it("refuses to run without a key", async () => {
    vi.stubEnv("TSUN_LLM_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "");
    const r = await generateLlmDraft(input);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("NOT_CONFIGURED");
  });
});
