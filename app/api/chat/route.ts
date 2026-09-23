// Conversation API: context builder -> tools -> deterministic character
// engine -> truth guard -> memory extractor -> persist. The LLM never decides
// numbers; tools supply facts and the validator enforces it.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildToolCard,
  detectRequiredFacts,
  overviewToCard,
  quoteToCard,
  type FactKind,
} from "@/lib/ai/context";
import { detectIntent, generateDeterministicReply, type ChatFacts } from "@/lib/ai/deterministic";
import { truthGuardFallback, validateResponse } from "@/lib/ai/validator";
import { getBTCPrice, getMarketOverview, getSOLPrice, getTokenPrice } from "@/lib/market/providers";
import { serverAppendMessages } from "@/lib/memory/store";
import { getTSUNPortfolio } from "@/lib/portfolio/simulated";
import { sanitizeCopy } from "@/lib/security/filters";
import { getWalletPortfolio } from "@/lib/solana/connection";
import type { ToolCardData } from "@/types/tsun";

const Body = z.object({
  message: z.string().min(1).max(2000),
  mood: z.string().default("ANNOYED"),
  relationship: z.string().default("STRANGER"),
  interactionCount: z.number().int().min(0).default(0),
  walletAddress: z.string().nullable().optional(),
  userId: z.string().max(64).nullable().optional(),
});

function fmtMoney(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "unknown";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(6)}`;
  return "$0.00";
}

async function fetchFacts(kinds: FactKind[], walletAddress: string | null): Promise<ChatFacts> {
  const facts: ChatFacts = {};
  const jobs: Promise<void>[] = [];
  if (kinds.includes("sol")) {
    jobs.push(getSOLPrice().then((r) => void (facts.sol = r)));
  }
  if (kinds.includes("btc")) {
    jobs.push(getBTCPrice().then((r) => void (facts.btc = r)));
  }
  if (kinds.includes("tsun")) {
    jobs.push(getTokenPrice().then((r) => void (facts.tsun = r)));
  }
  if (kinds.includes("market")) {
    jobs.push(getMarketOverview().then((r) => void (facts.market = r)));
  }
  if (kinds.includes("portfolio")) {
    jobs.push(getTSUNPortfolio().then((r) => void (facts.portfolio = r)));
  }
  if (kinds.includes("wallet") && walletAddress) {
    jobs.push(getWalletPortfolio(walletAddress).then((r) => void (facts.wallet = r)));
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

  const message = sanitizeCopy(body.message).slice(0, 2000);
  const walletConnected = !!body.walletAddress;
  const intent = detectIntent(message);
  const kinds = detectRequiredFacts(message, walletConnected);
  const facts = await fetchFacts(kinds, body.walletAddress ?? null);

  const reply = generateDeterministicReply({
    text: message,
    mood: body.mood as "ANNOYED",
    relationship: body.relationship as "STRANGER",
    interactionCount: body.interactionCount,
    facts,
    walletConnected,
  });

  // Truth guard: every financial figure must trace to a tool fact.
  const factPayload = {
    sol: facts.sol?.data,
    btc: facts.btc?.data,
    tsun: facts.tsun?.data,
    market: facts.market?.data,
    portfolio: facts.portfolio?.data,
    wallet: facts.wallet?.data,
  };
  const check = validateResponse({ text: reply.text, facts: factPayload });

  const now = new Date().toISOString();
  const text = check.ok ? check.sanitized : truthGuardFallback(check.violations[0] ?? "unsupported figure");
  const toolCard = check.ok ? cardForIntent(intent, facts) : undefined;

  if (body.userId) {
    serverAppendMessages(body.userId, [
      { id: `u-${now}`, role: "user", text: message, createdAt: now },
      { id: `t-${now}`, role: "tsun", text, createdAt: now, toolCard },
    ]);
  }

  return NextResponse.json({
    text,
    intent,
    suggestedMood: reply.suggestedMood,
    toolCard,
    memoryNotes: reply.memoryNotes.slice(0, 3),
    topics: reply.topics.slice(0, 4),
  });
}
