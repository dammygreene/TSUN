// MEMORY. What TSUN remembers about you, and what she never stores.
"use client";

import { useEffect, useState } from "react";
import { SectionLabel, TsunAvatar } from "@/components/os/ui";
import { loadMemory } from "@/lib/memory/store";
import { useTsunStore } from "@/lib/state/store";
import type { UserMemory } from "@/types/tsun";

export default function MemoryApp() {
  const mood = useTsunStore((s) => s.mood);
  const relationship = useTsunStore((s) => s.relationship);
  const [memory, setMemory] = useState<UserMemory | null>(null);

  useEffect(() => {
    setMemory(loadMemory());
  }, [relationship]);

  const forget = () => {
    try {
      window.localStorage.removeItem("tsun.memory.v1");
      window.localStorage.removeItem("tsun.conversation.v1");
      window.localStorage.removeItem("tsun.store.v1");
      window.localStorage.removeItem("tsun.milestones.v1");
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-3 rounded-lg border border-tsun-border bg-tsun-panel p-3">
        <TsunAvatar mood={mood} size={52} />
        <div>
          <div className="font-mono text-sm text-tsun-text">{relationship}</div>
          <div className="font-mono text-[11px] text-tsun-muted">
            {memory ? `${memory.interactionCount} interactions since ${new Date(memory.firstSeenAt).toLocaleDateString()}` : "No memory loaded yet. Talk to her first."}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-tsun-border bg-tsun-panel p-3">
        <SectionLabel>Discussed assets</SectionLabel>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(memory?.discussedAssets ?? []).length === 0 && <span className="font-mono text-xs text-tsun-dim">None yet.</span>}
          {(memory?.discussedAssets ?? []).map((a) => (
            <span key={a} className="rounded border border-tsun-border bg-tsun-void px-2 py-0.5 font-mono text-xs text-tsun-text">{a}</span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-tsun-border bg-tsun-panel p-3">
        <SectionLabel>Notes she keeps</SectionLabel>
        <ul className="mt-2 space-y-1.5">
          {(memory?.notes ?? []).length === 0 && <li className="font-mono text-xs text-tsun-dim">Nothing written down yet. Make an impression.</li>}
          {(memory?.notes ?? []).map((n, i) => (
            <li key={i} className="text-sm text-tsun-text">· {n}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-loss/40 bg-tsun-panel p-3">
        <SectionLabel>Never stored</SectionLabel>
        <p className="mt-1 font-mono text-xs leading-relaxed text-tsun-muted">
          Private keys, seed phrases, passwords, signing secrets. If you paste one, she yells at you and forgets it on purpose.
        </p>
      </div>

      <button
        onClick={forget}
        className="w-full rounded-md border border-loss/40 px-3 py-2.5 font-mono text-xs text-loss transition-colors hover:bg-loss/10"
      >
        FORGET ME (WIPE LOCAL MEMORY)
      </button>
    </div>
  );
}
