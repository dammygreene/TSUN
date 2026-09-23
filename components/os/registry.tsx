// Application registry. New TSUN//OS apps are added here without
// rewriting navigation. Secondary apps lazy load for a fast shell.
"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { AppId } from "@/lib/state/store";
import { LoadingLine } from "@/components/os/ui";

function lazy(importer: () => Promise<{ default: ComponentType }>, label: string) {
  return dynamic(importer, { loading: () => <LoadingLine label={label} /> });
}

const TerminalApp = lazy(() => import("@/components/terminal/TerminalApp"), "LOADING TERMINAL...");
const ChatApp = lazy(() => import("@/components/chat/ChatApp"), "ASKING TSUN...");
const MarketsApp = lazy(() => import("@/components/markets/MarketsApp"), "LOADING MARKETS...");
const WalletApp = lazy(() => import("@/components/apps/WalletApp"), "READING WALLET...");
const PortfolioApp = lazy(() => import("@/components/apps/PortfolioApp"), "LOADING PORTFOLIO...");
const XApp = lazy(() => import("@/components/lore/XApp"), "LOADING X FEED...");
const TimesApp = lazy(() => import("@/components/lore/TimesApp"), "PRINTING TIMES...");
const UnlocksApp = lazy(() => import("@/components/lore/UnlocksApp"), "CHECKING UNLOCKS...");
const MemoryApp = lazy(() => import("@/components/lore/MemoryApp"), "READING MEMORY...");
const FilesApp = lazy(() => import("@/components/lore/FilesApp"), "LISTING FILES...");

export interface TsunAppDefinition {
  id: AppId;
  title: string;
  icon: string;
  blurb: string;
  component: ComponentType;
  desktop: boolean;
  mobile: boolean;
}

export const APPS: TsunAppDefinition[] = [
  { id: "terminal", title: "Terminal", icon: ">_", blurb: "TSUN/SOL desk", component: TerminalApp, desktop: true, mobile: true },
  { id: "chat", title: "Chat", icon: "◐", blurb: "Talk to TSUN", component: ChatApp, desktop: true, mobile: true },
  { id: "markets", title: "Markets", icon: "▤", blurb: "Board + movers", component: MarketsApp, desktop: true, mobile: true },
  { id: "wallet", title: "My Money", icon: "⬡", blurb: "Your wallet", component: WalletApp, desktop: true, mobile: true },
  { id: "portfolio", title: "Portfolio", icon: "◈", blurb: "TSUN, simulated", component: PortfolioApp, desktop: true, mobile: true },
  { id: "x", title: "X//TSUN", icon: "✕", blurb: "Staging feed", component: XApp, desktop: true, mobile: true },
  { id: "newspaper", title: "Times", icon: "¶", blurb: "TSUN Times", component: TimesApp, desktop: true, mobile: true },
  { id: "unlocks", title: "Unlocks", icon: "◬", blurb: "Milestones", component: UnlocksApp, desktop: true, mobile: true },
  { id: "memory", title: "Memory", icon: "❖", blurb: "What she knows", component: MemoryApp, desktop: true, mobile: true },
  { id: "files", title: "Files", icon: "▦", blurb: "Her machine", component: FilesApp, desktop: true, mobile: true },
];

export function appById(id: AppId): TsunAppDefinition {
  const found = APPS.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown app: ${id}`);
  return found;
}
