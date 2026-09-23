// Mobile bottom navigation: Terminal, Chat, Markets, Portfolio, More.
"use client";

import type { AppId } from "@/lib/state/store";
import { useTsunStore } from "@/lib/state/store";
import { APPS } from "@/components/os/registry";
import { cn } from "@/lib/utils";
import { SettingsPanel } from "@/components/os/SettingsPanel";

const PRIMARY: AppId[] = ["terminal", "chat", "markets", "portfolio"];
const MORE: AppId[] = ["x", "newspaper", "unlocks", "files", "memory"];

function labelFor(app: AppId): string {
  return APPS.find((a) => a.id === app)?.title ?? app;
}

function iconFor(app: AppId): string {
  return APPS.find((a) => a.id === app)?.icon ?? "?";
}

export function MobileNav() {
  const active = useTsunStore((s) => s.activeMobileApp);
  const setActive = useTsunStore((s) => s.setActiveMobileApp);
  const moreOpen = useTsunStore((s) => s.mobileMoreOpen);
  const setMoreOpen = useTsunStore((s) => s.setMobileMoreOpen);

  return (
    <>
      <nav className="z-40 grid shrink-0 grid-cols-5 border-t border-tsun-border bg-tsun-ink" aria-label="Mobile navigation">
        {PRIMARY.map((id) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            aria-current={active === id ? "page" : undefined}
            className={cn(
              "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] font-mono tracking-wide",
              active === id ? "text-tsun-text" : "text-tsun-dim",
            )}
          >
            <span aria-hidden className="text-base">{iconFor(id)}</span>
            {labelFor(id).toUpperCase()}
          </button>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          aria-expanded={moreOpen}
          className={cn(
            "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] font-mono tracking-wide",
            moreOpen || MORE.includes(active) ? "text-tsun-text" : "text-tsun-dim",
          )}
        >
          <span aria-hidden className="text-base">···</span>
          MORE
        </button>
      </nav>
      {moreOpen && (
        <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-tsun-border bg-tsun-ink p-4 pb-8" role="dialog" aria-label="More applications">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-xs tracking-[0.14em] text-tsun-muted">MORE APPS</span>
            <button onClick={() => setMoreOpen(false)} className="rounded px-2 py-1 font-mono text-xs text-tsun-muted hover:text-tsun-text" aria-label="Close more menu">
              CLOSE
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MORE.map((id) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-3 text-sm",
                  active === id ? "border-tsun-borderLight bg-tsun-panel2 text-tsun-text" : "border-tsun-border bg-tsun-panel text-tsun-text",
                )}
              >
                <span aria-hidden>{iconFor(id)}</span>
                {labelFor(id)}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <SettingsPanel />
          </div>
        </div>
      )}
    </>
  );
}
