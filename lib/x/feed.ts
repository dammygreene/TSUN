// X//TSUN feed. MVP serves a clearly labeled STAGING feed only.
// Never fabricate a post as real, never show fake engagement counts.
// Real X API wiring is post MVP (stage 9) behind env config.

import type { XPost } from "@/types/tsun";

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

export const STAGING_FEED: XPost[] = [
  {
    id: "stage-001",
    content: "SOL is green and suddenly everyone is a macro strategist. I have seen smarter money in a vending machine.",
    createdAt: hoursAgo(3),
    status: "staging",
    sourceEvent: "SOL +6.1% move",
    mediaUrl: null,
    xPostId: null,
    xUrl: null,
    tab: "MARKET",
  },
  {
    id: "stage-002",
    content: "Portfolio update: still red, still strategic, still none of your business. Full blotter on my terminal.",
    createdAt: hoursAgo(9),
    status: "staging",
    sourceEvent: "Portfolio drawdown 18.2%",
    mediaUrl: null,
    xPostId: null,
    xUrl: null,
    tab: "PORTFOLIO",
  },
  {
    id: "stage-003",
    content: "They fired me for being correct too loudly. Anyway, how is your risk committee doing.",
    createdAt: hoursAgo(26),
    status: "staging",
    sourceEvent: null,
    mediaUrl: null,
    xPostId: null,
    xUrl: null,
    tab: "POSTS",
  },
  {
    id: "stage-004",
    content: "Milestone watch: every ATH unlocks a new piece of me. The market is slow, I am patient, you are neither.",
    createdAt: hoursAgo(50),
    status: "staging",
    sourceEvent: null,
    mediaUrl: null,
    xPostId: null,
    xUrl: null,
    tab: "MILESTONES",
  },
];

export const X_TABS = ["POSTS", "PORTFOLIO", "MARKET", "MILESTONES"] as const;
export type XTab = (typeof X_TABS)[number];

export function getStagingFeed(tab?: XTab | "ALL"): XPost[] {
  const sorted = [...STAGING_FEED].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  if (!tab || tab === "ALL") return sorted;
  return sorted.filter((p) => p.tab === tab);
}
