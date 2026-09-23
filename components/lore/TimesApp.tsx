// THE TSUN TIMES. Generated from structured app events, faithful to facts.
"use client";

import { useMemo } from "react";
import { generateTimesIssue } from "@/lib/times/generator";
import { useTsunStore } from "@/lib/state/store";
import type { TimesArticle } from "@/types/tsun";

function Story({ article, large }: { article: TimesArticle; large?: boolean }) {
  return (
    <article className="border-b border-tsun-border pb-4 last:border-0 last:pb-0">
      <h2 className={`font-bold leading-tight text-tsun-text ${large ? "text-2xl sm:text-3xl" : "text-lg"}`}>
        {article.headline}
      </h2>
      <p className="mt-1 text-sm text-tsun-muted">{article.subhead}</p>
      <p className="mt-2 text-sm leading-relaxed text-tsun-text">{article.body}</p>
      <div className="mt-2 font-mono text-[10px] text-tsun-dim">
        {new Date(article.timestamp).toLocaleString()} · SOURCE: {article.sourceEvent.toUpperCase()}
      </div>
    </article>
  );
}

export default function TimesApp() {
  const activeEvents = useTsunStore((s) => s.activeEvents);
  const market = useTsunStore((s) => s.market);
  const issue = useMemo(() => generateTimesIssue(activeEvents, market), [activeEvents, market]);

  return (
    <div className="space-y-4 p-4">
      <header className="border-b-2 border-tsun-text pb-3 text-center">
        <div className="text-3xl font-black tracking-tight text-tsun-text sm:text-4xl">THE TSUN TIMES</div>
        <div className="mt-1 flex items-center justify-center gap-3 font-mono text-[11px] text-tsun-muted">
          <span>{issue.volume}</span>
          <span>{new Date(issue.generatedAt).toLocaleDateString()}</span>
          <span className="text-profit">LIVE</span>
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <Story article={issue.main} large />
        <aside className="h-fit rounded-lg border border-tsun-border bg-tsun-panel p-3 lg:sticky lg:top-2">
          <div className="font-mono text-[11px] tracking-[0.14em] text-tsun-muted">MARKET BOARD</div>
          <div className="mt-2 space-y-1.5 font-mono text-xs">
            {(
              [
                ["TSUN", market?.tsun],
                ["SOL", market?.sol],
                ["BTC", market?.btc],
              ] as [string, { priceUsd: number | null; change24h: number | null } | null | undefined][]
            ).map(([label, quote]) => {
              const chg = quote?.change24h;
              return (
                <div key={label as string} className="flex justify-between">
                  <span className="text-tsun-muted">{label}</span>
                  <span className={typeof chg === "number" && chg < 0 ? "text-loss" : "text-profit"}>
                    {typeof chg === "number" ? `${chg >= 0 ? "+" : ""}${(chg * 100).toFixed(1)}%` : "n/a"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 font-mono text-[10px] text-tsun-dim">Verified quotes only. Gaps stay gaps.</div>
        </aside>
      </div>
      <div className="space-y-4 border-t border-tsun-border pt-4">
        {issue.stories.map((s) => (
          <Story key={s.id} article={s} />
        ))}
      </div>
    </div>
  );
}
