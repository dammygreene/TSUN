// Lightweight client side event bus. Market, portfolio, milestone, mood,
// and relationship events flow through here to notifications, the Times,
// unlocks, and character transitions.

import type { AgentEvent, AgentEventType, EventSeverity, TokenQuote } from "@/types/tsun";

export type EventHandler = (event: AgentEvent) => void;

const handlers = new Set<EventHandler>();

export function subscribe(handler: EventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function emit(event: AgentEvent): void {
  for (const h of [...handlers]) {
    try {
      h(event);
    } catch {
      /* one bad subscriber must not break the bus */
    }
  }
}

let seq = 0;

export function makeEvent(partial: {
  type: AgentEventType;
  severity: EventSeverity;
  title: string;
  body: string;
  linkedApp?: string;
  fact?: Record<string, number | string | null>;
  createdAt?: string;
}): AgentEvent {
  seq += 1;
  return {
    id: `evt-${Date.now().toString(36)}-${seq}`,
    createdAt: partial.createdAt ?? new Date().toISOString(),
    linkedApp: partial.linkedApp,
    fact: partial.fact,
    type: partial.type,
    severity: partial.severity,
    title: partial.title,
    body: partial.body,
  };
}

/** Pure detector: compare quotes and produce market events for big moves. */
export function evaluateMarketEvents(prev: TokenQuote | null, next: TokenQuote | null): AgentEvent[] {
  if (!next || next.priceUsd == null || next.change24h == null) return [];
  const out: AgentEvent[] = [];
  const chg = next.change24h;
  const moved = prev?.change24h == null || Math.abs(chg - (prev.change24h ?? 0)) >= 0.05;
  if (!moved) return [];
  if (Math.abs(chg) >= 0.4) {
    out.push(
      makeEvent({
        type: "MARKET_MOVE",
        severity: 3,
        title: `${next.symbol} ${chg >= 0 ? "RIPS" : "CRASHES"} ${(chg * 100).toFixed(1)}%`,
        body: chg >= 0 ? "TSUN STATUS: SMUG. Maybe the market finally developed taste." : "TSUN STATUS: EMBARRASSED. Nobody speak to her.",
        linkedApp: "terminal",
        fact: { symbol: next.symbol, change24h: chg, price: next.priceUsd },
      }),
    );
  } else if (Math.abs(chg) >= 0.2) {
    out.push(
      makeEvent({
        type: "MARKET_MOVE",
        severity: 2,
        title: `${next.symbol} ${chg >= 0 ? "+" : ""}${(chg * 100).toFixed(1)}%`,
        body: chg >= 0 ? "TSUN is pretending this was expected." : "TSUN is pretending not to see it.",
        linkedApp: "terminal",
        fact: { symbol: next.symbol, change24h: chg, price: next.priceUsd },
      }),
    );
  }
  return out;
}
