// Conversation API: rate limit -> context builder -> tools -> character engine
// (LLM draft when configured, else deterministic) -> truth guard -> memory
// extractor -> persist. Every turn and tool call is audited.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/ai/character";
import {
  buildMarketContextString,
  buildPortfolioContextString,
  buildToolCard,
  buildWalletContextString,
  detectRequiredFacts,
  overviewToCard,
  quoteToCard,
  type FactKind,
} from "@/lib/ai/context";
import { detectIntent, generateDeterministicReply, type ChatFacts } from "@/lib/ai/deterministic";
import { generateLlmDraft, llmProviderName } from "@/lib/ai/llm";
import { truthGuardFallback, validateResponse } from "@/lib/ai/validator";
import { getBTCPrice, getMarketOverview, getSOLPrice, getTokenPrice } from "@/lib/market/providers";
import { serverAppendMessages } from "@/lib/memory/store";
import { getTSUNPortfolio } from "@/lib/portfolio/simulated";
import { auditToolCall } from "@/lib/security/audit";
import { sanitizeCopy } from "@/lib/security/filters";
import { checkRateLimit, pruneRateLimits } from "@/lib/security/ratelimit";
import { getWalletPortfolio } from "@/lib/solana/connection";
import type { RelationshipLevel, ToolCardData, TsunMood } from "@/types/tsun";

const Body = z.object({
  message: z.string().min(1).max(2000),
  mood: z.string().default("ANNOYED"),
  relationship: z.string().default("STRANGER"),
  interactionCount: z.number().int().min(0).default(0),
  walletAddress: z.string().nullable().optional(),
  userId: z.string().max(64).nullable().optional(),
  memorySummary: z.string().max(1000).optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(800) })).max(8).optional(),
});

function fmtMoney(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "unknown";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(6)}`;
  return "$0.00";
}

async function fetchFacts(kinds: FactKind[], walletAddress: string | null, key: string): Promise<ChatFacts> {
  const facts: ChatFacts = {};
  const jobs: Promise<void>[] = [];
  const run = async (name: string, job: Promise<{ ok: boolean; source: string; error?: string }>, assign: (r: never) => void) => {
    const r = await job;
    assign(r as never);
    auditToolCall(name, r.ok, r.source, r.error, key);
  };
  if (kinds.includes("sol")) jobs.push(run("getSOLPrice", getSOLPrice(), (r) => void (facts.sol = r)));
  if (kinds.includes("btc")) jobs.push(run("getBTCPrice", getBTCPrice(), (r) => void (facts.btc = r)));
  if (kinds.includes("tsun")) jobs.push(run("getTokenPrice", getTokenPrice(), (r) => void (facts.tsun = r)));
  if (kinds.includes("market")) jobs.push(run("getMarketOverview", getMarketOverview(), (r) => void (facts.market = r)));
  if (kinds.includes("portfolio")) jobs.push(run("getTSUNPortfolio", getTSUNPortfolio(), (r) => void (facts.portfolio = r)));
  if (kinds.includes("wallet") && walletAddress) {
    jobs.push(run("getWalletPortfolio", getWalletPortfolio(walletAddress), (r) => void (facts.wallet = r)));
  }
  await Promise.all(jobs);
  return facts;
}

function cardForIntent(intent: string, facts: ChatFacts): ToolCardData | undefined {
  if (intent === "sol" && facts.sol) return quoteToCard("LIVE MARKET DATA · SOL", facts.sol);
  if (intent === "btc" && facts.btc) return quoteToCard("LIVE MARKET DATA · BTC", facts.btc);
  if (intent === "tsun_token" && facts.tsun) return quoteToCard("LIVE MARKET DATA · TSUN", facts.tsun);
  if (intent === "market_overview" && facts.market) return overviewToCard(facts.market);
  if (intent === "portfolio_hers" && facts.portfolio) {
    const p = facts.portfolio.ok ? facts.portfolio.data : undefined;
    return buildToolCard("portfolio", "TSUN PORTFOLIO · SIMULATED", facts.portfolio, [
      { label: "NAV", value: p?.currentNavUsd != null ? fmtMoney(p.currentNavUsd) : "UNAVAILABLE" },
      { label: "Total PnL", value: p?.totalPnlPct != null ? `${p.totalPnlPct.toFixed(2)}%` : "UNAVAILABLE" },
      { label: "Win rate", value: p?.winRate != null ? `${p.winRate}%` : "UNAVAILABLE" },
      { label: "Drawdown", value: p?.maxDrawdownPct != null ? `${p.maxDrawdownPct}%` : "UNAVAILABLE" },
    ]);
  }
  if (intent === "wallet" && facts.wallet) {
    const w = facts.wallet.ok ? facts.wallet.data : undefined;
    return buildToolCard("wallet", "WALLET FACTS", facts.wallet, [
      { label: "Total", value: w?.totalValueUsd != null ? fmtMoney(w.totalValueUsd) : "PARTIAL" },
      { label: "SOL", value: w?.solBalance != null ? w.solBalance.toFixed(4) : "UNAVAILABLE" },
      { label: "Largest", value: w?.largestHoldingSymbol ?? "UNAVAILABLE" },
      { label: "Stables", value: w?.stablecoinPct != null ? `${w.stablecoinPct}%` : "UNAVAILABLE" },
    ]);
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = body.userId ?? `ip:${ip}`;
  pruneRateLimits();
  const limit = checkRateLimit(key);
  if (!limit.ok) {
    auditToolCall("chat", false, "ratelimit", "RATE_LIMITED", key);
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429, headers: { "retry-after": String(Math.ceil(limit.retryAfterMs / 1000)) } });
  }

  const message = sanitizeCopy(body.message).slice(0, 2000);
  const walletConnected = !!body.walletAddress;
  const intent = detectIntent(message);
  const kinds = detectRequiredFacts(message, walletConnected);
  const facts = await fetchFacts(kinds, body.walletAddress ?? null, key);

  // Fact payload for the truth guard: every figure must trace to one of these.
  const factPayload = {
    sol: facts.sol?.data,
    btc: facts.btc?.data,
    tsun: facts.tsun?.data,
    market: facts.market?.data,
    portfolio: facts.portfolio?.data,
    wallet: facts.wallet?.data,
  };

  // Character engine: LLM draft when a provider is configured, with the
  // deterministic engine as the fallback for any failure.
  let engine: "llm" | "deterministic" = "deterministic";
  let draft: string | null = null;
  if (llmProviderName() !== "none") {
    const systemPrompt = buildSystemPrompt({
      mood: body.mood as TsunMood,
      relationship: body.relationship as RelationshipLevel,
      memorySummary: body.memorySummary ?? "No prior history supplied.",
      marketContext: [buildMarketContextString(facts), buildWalletContextString(facts.wallet)].join("\n"),
      portfolioContext: buildPortfolioContextString(facts.portfolio),
      toolAvailability: `market tools ${kinds.length > 0 ? "queried" : "idle"}, wallet ${walletConnected ? "connected" : "not connected"}`,
      nowIso: new Date().toISOString(),
    });
    const llm = await generateLlmDraft({ systemPrompt, history: body.history ?? [], userMessage: message });
    auditToolCall("llmDraft", llm.ok, llm.source, llm.error, key);
    if (llm.ok && llm.data) {
      draft = llm.data;
      engine = "llm";
    }
  }

  const fallback = generateDeterministicReply({
    text: message,
    mood: body.mood as TsunMood,
    relationship: body.relationship as RelationshipLevel,
    interactionCount: body.interactionCount,
    facts,
    walletConnected,
  });
  const raw = draft ?? fallback.text;

  // Truth guard on either engine. LLM drafts that invent figures are replaced.
  const check = validateResponse({ text: raw, facts: factPayload });
  const now = new Date().toISOString();
  const text = check.ok ? check.sanitized : truthGuardFallback(check.violations[0] ?? "unsupported figure");
  const toolCard = check.ok ? cardForIntent(intent, facts) : undefined;
  if (!check.ok) auditToolCall("truthGuard", false, engine, check.violations[0], key);

  if (body.userId) {
    serverAppendMessages(body.userId, [
      { id: `u-${now}`, role: "user", text: message, createdAt: now },
      { id: `t-${now}`, role: "tsun", text, createdAt: now, toolCard },
    ]);
  }
  auditToolCall("chat", true, engine, undefined, key);

  return NextResponse.json({
    text,
    intent,
    engine,
    suggestedMood: fallback.suggestedMood,
    toolCard,
    memoryNotes: fallback.memoryNotes.slice(0, 3),
    topics: fallback.topics.slice(0, 4),
  });
}
