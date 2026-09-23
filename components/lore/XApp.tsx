// X//TSUN. Staging feed only in the MVP, clearly labeled. No fabricated
// posts shown as real, no fake engagement counts.
"use client";

import { useState } from "react";
import { getStagingFeed, X_TABS, type XTab } from "@/lib/x/feed";
import { cn } from "@/lib/utils";

export default function XApp() {
  const [tab, setTab] = useState<XTab | "ALL">("ALL");
  const posts = getStagingFeed(tab);

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-lg border border-tsun-accent/40 bg-tsun-panel p-3">
        <div className="font-mono text-[11px] tracking-[0.14em] text-tsun-accent">STAGING FEED. NOT REAL X POSTS.</div>
        <p className="mt-1 text-xs text-tsun-muted">
          Drafts TSUN wrote for social. Real X wiring ships post MVP. Engagement counts are hidden until they come from the real API.
        </p>
      </div>
      <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Feed tabs">
        {(["ALL", ...X_TABS] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded px-2.5 py-1.5 font-mono text-[11px] transition-colors",
              tab === t ? "bg-tsun-panel2 text-tsun-text" : "text-tsun-dim hover:text-tsun-text",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {posts.map((p) => (
          <article key={p.id} className="rounded-lg border border-tsun-border bg-tsun-panel p-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-tsun-text">TSUN</span>
              <span className="rounded border border-tsun-border px-1.5 py-0.5 font-mono text-[10px] text-tsun-dim">{p.tab}</span>
              <span className="ml-auto font-mono text-[11px] text-tsun-dim">{new Date(p.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-tsun-text">{p.content}</p>
            {p.sourceEvent && (
              <div className="mt-2 inline-block rounded bg-tsun-panel2 px-2 py-0.5 font-mono text-[10px] tracking-wide text-tsun-muted">
                TRIGGERED BY {p.sourceEvent.toUpperCase()}
              </div>
            )}
            <div className="mt-2 font-mono text-[10px] text-tsun-dim">
              STATUS: {p.status.toUpperCase()}
              {p.xUrl && (
                <a href={p.xUrl} target="_blank" rel="noreferrer" className="ml-2 underline underline-offset-2">OPEN ON X</a>
              )}
            </div>
          </article>
        ))}
        {posts.length === 0 && (
          <p className="rounded-lg border border-tsun-border p-4 font-mono text-xs text-tsun-muted">No drafts in this tab yet.</p>
        )}
      </div>
    </div>
  );
}
