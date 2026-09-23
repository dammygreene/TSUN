// TSUN Times generator. Stories come from structured events, not free-form
// hallucination. Factual claims must match the linked event facts.

import type { AgentEvent, MarketOverview, TimesArticle, TimesIssue } from "@/types/tsun";

function fmtPct(frac: number | null | undefined): string | null {
  if (typeof frac !== "number" || !Number.isFinite(frac)) return null;
  const pct = frac * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function articleFromEvent(event: AgentEvent, index: number): TimesArticle {
  const f = event.fact ?? {};
  switch (event.type) {
    case "MARKET_MOVE": {
      const sym = String(f.symbol ?? "TSUN");
      const chg = fmtPct(typeof f.change24h === "number" ? f.change24h : null) ?? "a sharp move";
      const up = typeof f.change24h === "number" && f.change24h >= 0;
      return {
        id: `times-${event.id}`,
        headline: up ? `THE MARKET IS WRONG, CLAIMS WOMAN UP ${chg}` : `${sym} DUMPS, TSUN DECLARES EMOTIONAL SUPPORT CLOSED`,
        subhead: `${sym} moved ${chg}. TSUN reacts with characteristic grace.`,
        body: up
          ? `In a stunning validation of one specific trading AI, ${sym} gained ${chg} and TSUN took full credit. "Maybe the market finally developed taste," she said, declining to elaborate on previous red days. Analysts confirm the number is real and the humility is not.`
          : `After ${sym} dropped ${chg}, TSUN requested total silence and one (1) new liquidity provider. "Nobody speak to me," she told reporters, which is to say, the terminal. The desk confirms the loss is strategic and the strategy is classified.`,
        timestamp: event.createdAt,
        sourceEvent: event.id,
        fact: f,
      };
    }
    case "MILESTONE_REACHED": {
      const target = String(f.target ?? "a new ATH");
      return {
        id: `times-${event.id}`,
        headline: `TSUN REACHES ${target} MARKET CAP`,
        subhead: "TSUN: this community is less useless than expected.",
        body: `TSUN crossed a ${target} all time high market cap, unlocking a new character state. Celebrations were muted, by which we mean TSUN insulted everyone fondly and returned to the charts. The unlock is permanent. The attitude is permanent-er.`,
        timestamp: event.createdAt,
        sourceEvent: event.id,
        fact: f,
      };
    }
    case "PORTFOLIO_TRADE":
    case "PORTFOLIO_DRAW_DOWN": {
      return {
        id: `times-${event.id}`,
        headline: event.title.toUpperCase(),
        subhead: "The public blotter remains public, unfortunately for TSUN.",
        body: `${event.body} Readers are reminded the MVP portfolio is SIMULATED, the embarrassment is not. TSUN declined to comment beyond a sustained sigh picked up by desk microphones.`,
        timestamp: event.createdAt,
        sourceEvent: event.id,
        fact: f,
      };
    }
    default: {
      return {
        id: `times-${event.id}-${index}`,
        headline: event.title.toUpperCase(),
        subhead: "Notes from inside the workstation.",
        body: event.body,
        timestamp: event.createdAt,
        sourceEvent: event.id,
        fact: f,
      };
    }
  }
}

function marketBoardArticle(market: MarketOverview | null, nowIso: string): TimesArticle {
  const sol = market?.sol?.change24h;
  const btc = market?.btc?.change24h;
  const tsun = market?.tsun?.change24h;
  const parts = [
    `SOL ${fmtPct(sol) ?? "n/a"}`,
    `BTC ${fmtPct(btc) ?? "n/a"}`,
    `TSUN ${fmtPct(tsun) ?? "n/a"}`,
  ];
  return {
    id: "times-board",
    headline: "MARKET BOARD",
    subhead: parts.join("  |  "),
    body: market
      ? `Overnight desk read: ${parts.join(", ")}. Sentiment: ${market.sentiment ?? "unknown"}. TSUN's official comment: "Numbers exist. Interpret them correctly or do not speak."`
      : "Market data is currently unavailable. TSUN refuses to invent the board and suggests staring at the void instead.",
    timestamp: nowIso,
    sourceEvent: "market-board",
    fact: { sol: sol ?? null, btc: btc ?? null, tsun: tsun ?? null },
  };
}

export function generateTimesIssue(events: AgentEvent[], market: MarketOverview | null, nowIso?: string): TimesIssue {
  const now = nowIso ?? new Date().toISOString();
  const newsy = events.filter((e) => e.severity >= 2).slice(0, 5);
  const stories = newsy.map(articleFromEvent);
  const main =
    stories.length > 0
      ? stories[0]
      : {
          id: "times-quiet",
          headline: "QUIET ON THE DESK",
          subhead: "TSUN uses the calm to judge everyone preemptively.",
          body: "No major events crossed the wire. TSUN spent the session reorganizing files, insulting the risk model, and waiting for the market to do something interesting. The market, a coward, did nothing.",
          timestamp: now,
          sourceEvent: "none",
          fact: {},
        };
  return {
    volume: "VOL. 02",
    generatedAt: now,
    main,
    stories: [marketBoardArticle(market, now), ...stories.slice(1)],
  };
}
