// FILES. TSUN's machine. Data driven from the lore registry.
"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/os/ui";
import { FILE_FOLDERS, filesForFolder, TSUN_FILES } from "@/lib/files/registry";
import { useTsunStore } from "@/lib/state/store";
import { cn } from "@/lib/utils";
import type { TsunFile } from "@/types/tsun";

export default function FilesApp() {
  const unlockedFiles = useTsunStore((s) => s.unlockedFiles);
  const [folder, setFolder] = useState<string>("desktop");
  const [openId, setOpenId] = useState<string | null>(null);

  const open: TsunFile | null = openId ? (TSUN_FILES.find((f) => f.id === openId) ?? null) : null;
  const list = filesForFolder(folder);

  return (
    <div className="flex h-full min-h-[320px] flex-col md:flex-row">
      <aside className="shrink-0 border-b border-tsun-border p-3 md:w-44 md:border-b-0 md:border-r">
        <SectionLabel>Folders</SectionLabel>
        <div className="mt-2 flex gap-1 overflow-x-auto md:flex-col">
          {FILE_FOLDERS.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFolder(f);
                setOpenId(null);
              }}
              className={cn(
                "shrink-0 rounded px-2 py-1.5 text-left font-mono text-xs",
                folder === f ? "bg-tsun-panel2 text-tsun-text" : "text-tsun-dim hover:text-tsun-text",
              )}
            >
              /{f}
            </button>
          ))}
        </div>
      </aside>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {!open ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {list.map((f) => {
              const unlocked = unlockedFiles.includes(f.id);
              return (
                <button
                  key={f.id}
                  disabled={!unlocked}
                  onClick={() => setOpenId(f.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    unlocked ? "border-tsun-border bg-tsun-panel hover:border-tsun-borderLight" : "cursor-not-allowed border-tsun-border bg-tsun-void opacity-70",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-tsun-accent" aria-hidden>{unlocked ? "▦" : "🔒"}</span>
                    <span className="truncate font-mono text-xs text-tsun-text">{f.title}</span>
                  </div>
                  <div className="mt-1 text-xs text-tsun-muted">{unlocked ? f.blurb : f.unlockCondition ?? "Locked"}</div>
                </button>
              );
            })}
            {list.length === 0 && <p className="font-mono text-xs text-tsun-dim">Empty folder. Suspiciously clean.</p>}
          </div>
        ) : (
          <div>
            <button onClick={() => setOpenId(null)} className="mb-2 font-mono text-xs text-tsun-muted hover:text-tsun-text">
              ← BACK TO /{folder}
            </button>
            <div className="rounded-lg border border-tsun-border bg-tsun-void p-4">
              <div className="font-mono text-xs text-tsun-muted">&gt; {open.path}</div>
              <div className="mt-1 font-mono text-[11px] text-tsun-dim">OWNER: TSUN · TYPE: {open.type.toUpperCase()}</div>
              <pre className="mt-3 whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-tsun-text">{open.body ?? "(empty)"}</pre>
              {open.type === "audio" && (
                <p className="mt-3 font-mono text-[11px] text-tsun-dim">Media player easter egg ships with sound enabled. The tracklist is the joke for now.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
