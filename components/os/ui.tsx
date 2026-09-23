// Shared OS primitives: panels, badges, avatar, error and loading states.
"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { DataState, TsunMood } from "@/types/tsun";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-tsun-border bg-tsun-panel", className)}>{children}</div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-tsun-muted">{children}</div>
  );
}

const DOT_COLOR: Record<string, string> = {
  live: "bg-profit",
  connected: "bg-profit",
  syncing: "bg-amber-400",
  offline: "bg-loss",
  idle: "bg-tsun-dim",
  smug: "bg-tsun-accent",
};

export function StatusDot({ tone = "live", pulse }: { tone?: keyof typeof DOT_COLOR | string; pulse?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        DOT_COLOR[tone as string] ?? "bg-tsun-dim",
        pulse && "animate-pulse",
      )}
    />
  );
}

const STATE_STYLE: Record<DataState, string> = {
  loading: "text-tsun-muted border-tsun-border",
  loaded: "text-profit border-profit/40",
  stale: "text-amber-400 border-amber-400/40",
  error: "text-loss border-loss/40",
  unavailable: "text-tsun-dim border-tsun-border",
};

const STATE_LABEL: Record<DataState, string> = {
  loading: "LOADING",
  loaded: "LIVE",
  stale: "STALE",
  error: "ERROR",
  unavailable: "UNAVAILABLE",
};

export function DataBadge({ state, className }: { state: DataState; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.12em]",
        STATE_STYLE[state],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1 w-1 rounded-full",
          state === "loaded" && "bg-profit",
          state === "loading" && "bg-tsun-muted animate-pulse",
          state === "stale" && "bg-amber-400",
          state === "error" && "bg-loss",
          state === "unavailable" && "bg-tsun-dim",
        )}
      />
      {STATE_LABEL[state]}
    </span>
  );
}

export function LoadingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs text-tsun-muted" role="status" aria-live="polite">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border border-tsun-border border-t-tsun-muted" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorBlock({
  title,
  lastSuccess,
  tsun,
  retry,
}: {
  title: string;
  lastSuccess?: string | null;
  tsun: string;
  retry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-loss/40 bg-tsun-panel p-4" role="alert">
      <div className="font-mono text-xs tracking-[0.12em] text-loss">{title}</div>
      {lastSuccess && <div className="mt-1 font-mono text-[11px] text-tsun-muted">Last successful update: {lastSuccess}</div>}
      <div className="mt-2 text-sm text-tsun-text">
        <span className="font-mono text-xs text-tsun-muted">TSUN: </span>
        {tsun}
      </div>
      {retry && (
        <button
          onClick={retry}
          className="mt-3 rounded-md border border-tsun-border bg-tsun-panel2 px-3 py-1.5 text-xs text-tsun-text transition-colors hover:border-tsun-borderLight"
        >
          RETRY
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-tsun-border bg-tsun-panel p-4">
      <div className="font-mono text-xs tracking-[0.12em] text-tsun-muted">{title}</div>
      <div className="mt-1 text-sm text-tsun-text">{body}</div>
    </div>
  );
}

/** System avatar. Geometric placeholder until milestone artwork ships. */
export function TsunAvatar({ mood, size = 64 }: { mood: TsunMood; size?: number }) {
  const accent =
    mood === "DERE" || mood === "FLUSTERED" || mood === "EMBARRASSED"
      ? "#e5486f"
      : mood === "ANGRY" || mood === "FURIOUS"
        ? "#ff5d5d"
        : mood === "SMUG" || mood === "HAPPY"
          ? "#f1f1ed"
          : "#8a8a86";
  const angry = mood === "ANGRY" || mood === "FURIOUS";
  const soft = mood === "DERE" || mood === "HAPPY";
  const panic = mood === "PANICKING";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`TSUN avatar, mood ${mood}`}>
      <rect x="1" y="1" width="62" height="62" rx="10" fill="#151515" stroke="#282828" />
      <text x="32" y="16" textAnchor="middle" fill="#555552" fontSize="8" fontFamily="monospace" letterSpacing="2">
        TSUN
      </text>
      {angry ? (
        <g stroke={accent} strokeWidth="2.5" strokeLinecap="round">
          <line x1="14" y1="26" x2="27" y2="31" />
          <line x1="50" y1="26" x2="37" y2="31" />
        </g>
      ) : (
        <g fill={accent}>
          <rect x="15" y="28" width={panic ? 5 : 9} height="3" rx="1" />
          <rect x={panic ? 44 : 40} y="28" width={panic ? 5 : 9} height="3" rx="1" />
        </g>
      )}
      {soft ? (
        <path d="M24 44 Q32 49 40 44" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : angry ? (
        <line x1="24" y1="47" x2="40" y2="43" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <line x1="25" y1="45" x2="39" y2="45" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
