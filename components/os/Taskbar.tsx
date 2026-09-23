// Desktop workstation control bar: launcher, open apps, system status.
"use client";

import { useState } from "react";
import { APPS } from "@/components/os/registry";
import { formatClock, StatusDot, useNow } from "@/components/os/ui";
import { playSound } from "@/lib/sound/engine";
import { useTsunStore } from "@/lib/state/store";
import { cn } from "@/lib/utils";

export function Taskbar() {
  const windows = useTsunStore((s) => s.windows);
  const activeWindow = useTsunStore((s) => s.activeWindow);
  const openApp = useTsunStore((s) => s.openApp);
  const focusApp = useTsunStore((s) => s.focusApp);
  const toggleMinimize = useTsunStore((s) => s.toggleMinimize);
  const mood = useTsunStore((s) => s.mood);
  const user = useTsunStore((s) => s.user);
  const soundOn = useTsunStore((s) => s.soundOn);
  const setSoundOn = useTsunStore((s) => s.setSoundOn);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const now = useNow(15000);

  return (
    <footer className="relative z-40 flex h-11 shrink-0 items-center gap-2 border-t border-tsun-border bg-tsun-ink px-3">
      <button
        onClick={() => setLauncherOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-tsun-border bg-tsun-panel px-3 py-1.5 font-mono text-xs text-tsun-text transition-colors hover:border-tsun-borderLight"
        aria-expanded={launcherOpen}
        aria-label="Application launcher"
      >
        <span className="font-bold text-tsun-accent">TSUN</span>
      </button>
      <div className="flex flex-1 items-center gap-1 overflow-x-auto" role="tablist" aria-label="Open applications">
        {windows.map((w) => {
          const app = APPS.find((a) => a.id === w.id);
          const active = activeWindow === w.id && !w.minimized;
          return (
            <button
              key={w.id}
              role="tab"
              aria-selected={active}
              onClick={() => (active ? toggleMinimize(w.id) : focusApp(w.id))}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors",
                active
                  ? "border-tsun-borderLight bg-tsun-panel2 text-tsun-text"
                  : "border-transparent text-tsun-muted hover:bg-tsun-panel hover:text-tsun-text",
              )}
            >
              <span aria-hidden>{app?.icon}</span>
              {app?.title}
              {w.minimized && <span className="text-tsun-dim">_</span>}
            </button>
          );
        })}
        {windows.length === 0 && <span className="font-mono text-[11px] text-tsun-dim">No apps open. She is judging your idle desktop.</span>}
      </div>
      <div className="hidden items-center gap-3 font-mono text-[11px] text-tsun-muted lg:flex">
        <span className="flex items-center gap-1.5">
          <StatusDot tone="smug" /> MOOD: {mood}
        </span>
        <span>{user?.walletAddress ? `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}` : "NO WALLET"}</span>
        <button onClick={() => setSoundOn(!soundOn)} className="rounded px-1.5 py-1 hover:bg-tsun-panel hover:text-tsun-text" aria-label={soundOn ? "Mute sound" : "Unmute sound"}>
          {soundOn ? "SND ON" : "SND OFF"}
        </button>
        <span className="text-tsun-text">{formatClock(now)}</span>
      </div>
      {launcherOpen && (
        <div className="absolute bottom-12 left-2 w-64 rounded-lg border border-tsun-border bg-tsun-panel p-2 shadow-xl" role="menu">
          {APPS.filter((a) => a.desktop).map((app) => (
            <button
              key={app.id}
              role="menuitem"
              onClick={() => {
                openApp(app.id);
                playSound("open");
                setLauncherOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm text-tsun-text transition-colors hover:bg-tsun-panel2"
            >
              <span aria-hidden className="w-5 text-center">{app.icon}</span>
              <span>{app.title}</span>
              <span className="ml-auto font-mono text-[10px] text-tsun-dim">{app.blurb}</span>
            </button>
          ))}
        </div>
      )}
    </footer>
  );
}
