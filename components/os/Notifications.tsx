// Global notification stack plus the major event overlay (severity 3).
"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTsunStore } from "@/lib/state/store";

export function NotificationStack() {
  const notices = useTsunStore((s) => s.notices);
  const dismiss = useTsunStore((s) => s.dismissNotice);
  const reducedMotion = useTsunStore((s) => s.reducedMotion);

  useEffect(() => {
    if (notices.length === 0) return;
    const timers = notices.map((n) => setTimeout(() => dismiss(n.id), 7000));
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [notices, dismiss]);

  return (
    <div className="pointer-events-none absolute right-3 top-12 z-[70] flex w-[calc(100%-24px)] max-w-xs flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {notices.map((n) => (
          <motion.div
            key={n.id}
            initial={reducedMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto rounded-lg border border-tsun-border bg-tsun-panel p-3 shadow-xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-mono text-[10px] tracking-[0.14em] text-tsun-accent">TSUN//ALERT</div>
              <button onClick={() => dismiss(n.id)} className="font-mono text-[10px] text-tsun-dim hover:text-tsun-text" aria-label="Dismiss notification">
                X
              </button>
            </div>
            <div className="mt-1 text-xs font-semibold text-tsun-text">{n.title}</div>
            <div className="mt-0.5 text-xs text-tsun-muted">{n.body}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function MajorEventOverlay() {
  const major = useTsunStore((s) => s.majorEvent);
  const dismiss = useTsunStore((s) => s.dismissMajor);
  const openApp = useTsunStore((s) => s.openApp);
  const setActiveMobileApp = useTsunStore((s) => s.setActiveMobileApp);
  const reducedMotion = useTsunStore((s) => s.reducedMotion);

  useEffect(() => {
    if (!major) return;
    const t = setTimeout(() => dismiss(), 6000);
    return () => clearTimeout(t);
  }, [major, dismiss]);

  return (
    <AnimatePresence>
      {major && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
          className="absolute inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          role="alertdialog"
          aria-label={major.title}
        >
          <motion.div
            initial={reducedMotion ? false : { scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md rounded-xl border border-tsun-borderLight bg-tsun-ink p-6 text-center"
          >
            <div className="font-mono text-[11px] tracking-[0.2em] text-tsun-accent">TSUN//EVENT</div>
            <div className="mt-3 text-2xl font-bold text-tsun-text">{major.title}</div>
            <div className="mt-2 text-sm text-tsun-muted">{major.body}</div>
            <div className="mt-5 flex justify-center gap-2">
              {major.linkedApp && (
                <button
                  onClick={() => {
                    const id = major.linkedApp as "unlocks";
                    openApp(id);
                    setActiveMobileApp(id);
                    dismiss();
                  }}
                  className="rounded-md bg-tsun-text px-4 py-2 text-xs font-bold text-black transition-transform active:translate-y-px"
                >
                  VIEW UNLOCK
                </button>
              )}
              <button
                onClick={dismiss}
                className="rounded-md border border-tsun-border px-4 py-2 font-mono text-xs text-tsun-muted hover:text-tsun-text"
              >
                DISMISS
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
