// Boot sequence controller: IDLE -> BIOS -> MEMORY -> NETWORK -> DATA ->
// PORTFOLIO -> USER -> READY. Skippable at every step. Statuses are real:
// a failed check renders FAILED, never OK.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTsunStore, type BootStage } from "@/lib/state/store";

interface BootLine {
  label: string;
  status: string;
  ok: boolean;
}

const ORDER: BootStage[] = ["BIOS", "MEMORY", "NETWORK", "DATA", "PORTFOLIO", "USER", "READY"];

export function BootScreen() {
  const bootStage = useTsunStore((s) => s.bootStage);
  const setBootStage = useTsunStore((s) => s.setBootStage);
  const completeBoot = useTsunStore((s) => s.completeBoot);
  const skipBoot = useTsunStore((s) => s.skipBoot);
  const bootCompressed = useTsunStore((s) => s.bootCompressed);
  const mood = useTsunStore((s) => s.mood);
  const relationship = useTsunStore((s) => s.relationship);
  const interactionCount = useTsunStore((s) => s.interactionCount);
  const reducedMotion = useTsunStore((s) => s.reducedMotion);
  const [lines, setLines] = useState<BootLine[]>([]);
  const [started, setStarted] = useState(false);
  const done = useRef(false);

  const push = useCallback((line: BootLine) => {
    setLines((prev) => [...prev, line]);
  }, []);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    setStarted(true);
    const returning = interactionCount > 0;
    const fast = bootCompressed || reducedMotion;

    const run = async () => {
      const step = async (stage: BootStage) => {
        setBootStage(stage);
        if (!fast) await new Promise((r) => setTimeout(r, 260));
      };

      await step("BIOS");
      push({ label: "TSUN SYSTEMS BIOS v2.04", status: "", ok: true });

      await step("MEMORY");
      push({ label: "MEMORY", status: returning ? `USER CONTEXT FOUND (${interactionCount} visits)` : "FRESH CONTEXT", ok: true });

      await step("NETWORK");
      let networkOk = typeof navigator === "undefined" ? true : navigator.onLine;
      let health: { market?: string; rpc?: string } | null = null;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch("/api/health", { signal: ctrl.signal, cache: "no-store" });
        clearTimeout(t);
        if (res.ok) {
          health = (await res.json()) as { market?: string; rpc?: string };
        } else {
          networkOk = false;
        }
      } catch {
        networkOk = false;
      }
      push({ label: "NETWORK", status: networkOk ? "OK" : "FAILED", ok: networkOk });

      await step("DATA");
      const marketState = health?.market ?? (networkOk ? "UNKNOWN" : "FAILED");
      push({ label: "MARKET DATA", status: marketState === "loaded" ? "OK" : marketState.toUpperCase(), ok: marketState === "loaded" });
      const rpcState = health?.rpc ?? "UNKNOWN";
      push({ label: "SOLANA RPC", status: rpcState === "loaded" ? "OK" : rpcState.toUpperCase(), ok: rpcState === "loaded" });

      await step("PORTFOLIO");
      push({ label: "PORTFOLIO", status: "SIMULATED MODE", ok: true });

      await step("USER");
      push({ label: "MOOD", status: mood, ok: true });
      push({ label: "RELATIONSHIP", status: relationship, ok: true });

      await step("READY");
      if (!fast) await new Promise((r) => setTimeout(r, 500));
      completeBoot();
    };

    void run();
  }, [bootCompressed, completeBoot, interactionCount, mood, push, reducedMotion, relationship, setBootStage]);

  const returning = interactionCount > 0;

  return (
    <motion.div
      className="flex h-full flex-col bg-tsun-void p-6 font-mono text-[13px] sm:p-10"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto flex h-full w-full max-w-xl flex-col">
        <div className="flex-1 space-y-1.5 pt-8" aria-live="polite">
          {lines.map((l, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-tsun-muted">{l.label}</span>
              {l.status && (
                <>
                  <span className="flex-1 overflow-hidden text-tsun-dim">{"........".repeat(8)}</span>
                  <span className={l.ok ? "text-profit" : "text-loss"}>{l.status}</span>
                </>
              )}
            </div>
          ))}
          {bootStage === "READY" && (
            <div className="pt-6">
              <div className="text-lg font-bold text-tsun-text">
                {returning ? "WELCOME BACK." : "TSUN IS AWAKE."}
              </div>
              <div className="mt-1 text-tsun-muted">
                {returning ? "You again. The workstation kept your seat warm." : "Why are you here?"}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pb-4">
          <span className="text-[11px] text-tsun-dim">
            {Math.max(1, ORDER.indexOf(bootStage) + 1)}/{ORDER.length} {bootStage}
          </span>
          {started && bootStage !== "READY" && (
            <button
              onClick={skipBoot}
              className="rounded-md border border-tsun-border px-4 py-2 text-xs text-tsun-muted transition-colors hover:border-tsun-borderLight hover:text-tsun-text"
            >
              SKIP
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
