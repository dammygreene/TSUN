// User preferences: alerts, sound, motion. Sound defaults to off.
"use client";

import { useTsunStore } from "@/lib/state/store";
import { SectionLabel } from "@/components/os/ui";

function Toggle({ label, on, onChange, hint }: { label: string; on: boolean; onChange: (v: boolean) => void; hint: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors hover:bg-tsun-panel2"
    >
      <span>
        <span className="block text-sm text-tsun-text">{label}</span>
        <span className="block font-mono text-[11px] text-tsun-dim">{hint}</span>
      </span>
      <span className={`font-mono text-xs ${on ? "text-profit" : "text-tsun-dim"}`}>{on ? "ON" : "OFF"}</span>
    </button>
  );
}

export function SettingsPanel() {
  const marketAlertsMuted = useTsunStore((s) => s.marketAlertsMuted);
  const charAlertsMuted = useTsunStore((s) => s.charAlertsMuted);
  const soundOn = useTsunStore((s) => s.soundOn);
  const reducedMotion = useTsunStore((s) => s.reducedMotion);
  const setMarketAlertsMuted = useTsunStore((s) => s.setMarketAlertsMuted);
  const setCharAlertsMuted = useTsunStore((s) => s.setCharAlertsMuted);
  const setSoundOn = useTsunStore((s) => s.setSoundOn);
  const setReducedMotion = useTsunStore((s) => s.setReducedMotion);

  return (
    <div className="rounded-lg border border-tsun-border bg-tsun-panel p-2">
      <div className="px-2 pb-1 pt-1">
        <SectionLabel>Settings</SectionLabel>
      </div>
      <Toggle label="Market alerts" on={!marketAlertsMuted} onChange={(v) => setMarketAlertsMuted(!v)} hint="Price moves, portfolio, milestones" />
      <Toggle label="Character alerts" on={!charAlertsMuted} onChange={(v) => setCharAlertsMuted(!v)} hint="Mood, relationship, TSUN remarks" />
      <Toggle label="Sound" on={soundOn} onChange={setSoundOn} hint="Off by default. Ticks and chimes." />
      <Toggle label="Reduced motion" on={reducedMotion} onChange={setReducedMotion} hint="Calms animation across the OS" />
      <p className="px-2 pb-2 pt-1 font-mono text-[11px] leading-relaxed text-tsun-dim">
        RISK: Nothing here is financial advice. Markets can and will embarrass you.
      </p>
    </div>
  );
}
