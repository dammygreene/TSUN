// UNLOCKS. ATH market cap milestone timeline. Unlocks are permanent.
"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/os/ui";
import { useTsunStore } from "@/lib/state/store";
import { cn } from "@/lib/utils";

export default function UnlocksApp() {
  const milestones = useTsunStore((s) => s.milestones);
  const athMarketCap = useTsunStore((s) => s.athMarketCap);
  const [open, setOpen] = useState<string | null>(null);

  const done = milestones.filter((m) => m.status === "UNLOCKED").length;

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-lg border border-tsun-border bg-tsun-panel p-3">
        <SectionLabel>TSUN evolution</SectionLabel>
        <div className="mt-1 font-mono text-sm text-tsun-text">
          {done}/{milestones.length} UNLOCKED
        </div>
        <div className="mt-1 font-mono text-[11px] text-tsun-dim">
          ATH market cap: {athMarketCap != null ? `$${athMarketCap.toLocaleString()}` : "unknown yet"}. Unlocks trigger on all time highs and never relock.
        </div>
      </div>
      <div className="space-y-2">
        {milestones.map((m) => {
          const unlocked = m.status === "UNLOCKED";
          const expanded = open === m.id;
          const progress = athMarketCap != null ? Math.min(1, athMarketCap / m.targetMarketCap) : 0;
          return (
            <div key={m.id} className={cn("rounded-lg border bg-tsun-panel", unlocked ? "border-profit/40" : "border-tsun-border")}>
              <button
                onClick={() => setOpen(expanded ? null : m.id)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
              >
                <span className={cn("w-14 shrink-0 font-mono text-sm font-bold", unlocked ? "text-profit" : "text-tsun-text")}>{m.title}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-tsun-void" aria-hidden>
                  <span className={cn("block h-full", unlocked ? "bg-profit" : "bg-tsun-borderLight")} style={{ width: `${Math.round(progress * 100)}%` }} />
                </span>
                <span className={cn("shrink-0 font-mono text-[10px] tracking-[0.12em]", unlocked ? "text-profit" : "text-tsun-dim")}>
                  {unlocked ? "COMPLETE" : "LOCKED"}
                </span>
              </button>
              {expanded && (
                <div className="space-y-1.5 border-t border-tsun-border px-3 py-3 text-sm">
                  <div className="font-mono text-[11px] text-tsun-muted">REQUIREMENT: ATH ${m.targetMarketCap.toLocaleString()}</div>
                  {unlocked && <div className="font-mono text-[11px] text-profit">REACHED: {m.reachedAt ? new Date(m.reachedAt).toLocaleString() : "unknown"}</div>}
                  <div><span className="font-mono text-[11px] text-tsun-muted">DIALOGUE: </span><span className="text-tsun-text">{m.dialogueUnlock}</span></div>
                  <div><span className="font-mono text-[11px] text-tsun-muted">PERSONALITY: </span><span className="text-tsun-text">{m.personalityUnlock}</span></div>
                  <div><span className="font-mono text-[11px] text-tsun-muted">VISUAL: </span><span className="text-tsun-text">{m.visualUnlock}</span></div>
                  <div className="font-mono text-[11px] text-tsun-dim">
                    {m.artworkUrl ? "Artwork attached." : "Artwork: pending generation."} {m.postId ? `Post: ${m.postId}` : "Post: not published yet."}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
