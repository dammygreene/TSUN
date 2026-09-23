// Desktop window manager: floating panels with drag, focus, z order,
// minimize, maximize, close, resize. Desktop only, never on mobile.
"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { appById } from "@/components/os/registry";
import { playSound } from "@/lib/sound/engine";
import { useTsunStore, type AppId, type WindowState } from "@/lib/state/store";
import { cn } from "@/lib/utils";
import { DataBadge } from "@/components/os/ui";

function WindowChrome({ win }: { win: WindowState }) {
  const app = appById(win.id);
  const activeWindow = useTsunStore((s) => s.activeWindow);
  const focusApp = useTsunStore((s) => s.focusApp);
  const closeApp = useTsunStore((s) => s.closeApp);
  const toggleMinimize = useTsunStore((s) => s.toggleMinimize);
  const toggleMaximize = useTsunStore((s) => s.toggleMaximize);
  const moveWindow = useTsunStore((s) => s.moveWindow);
  const resizeWindow = useTsunStore((s) => s.resizeWindow);
  const reducedMotion = useTsunStore((s) => s.reducedMotion);
  const dataStatus = useTsunStore((s) => s.dataStatus);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const resizing = useRef<{ sx: number; sy: number; w: number; h: number } | null>(null);

  const active = activeWindow === win.id;
  const Body = app.component;

  const onHeaderDown = (e: ReactPointerEvent) => {
    if (win.maximized) return;
    focusApp(win.id);
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onHeaderMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    moveWindow(win.id, e.clientX - drag.current.dx, e.clientY - drag.current.dy);
  };
  const onHeaderUp = () => {
    drag.current = null;
  };

  const onResizeDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    resizing.current = { sx: e.clientX, sy: e.clientY, w: win.w, h: win.h };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onResizeMove = (e: ReactPointerEvent) => {
    const r = resizing.current;
    if (!r) return;
    resizeWindow(win.id, r.w + (e.clientX - r.sx), r.h + (e.clientY - r.sy));
  };
  const onResizeUp = () => {
    resizing.current = null;
  };

  if (win.minimized) return null;

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, scale: 0.97, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      aria-label={app.title}
      onPointerDown={() => focusApp(win.id)}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-[10px] border bg-tsun-ink shadow-2xl",
        active ? "border-tsun-borderLight" : "border-tsun-border",
        win.maximized && "inset-2",
      )}
      style={
        win.maximized
          ? { zIndex: win.z }
          : {
              left: win.x,
              top: win.y,
              width: win.w,
              height: win.h,
              maxWidth: "calc(100% - 16px)",
              maxHeight: "calc(100% - 16px)",
              zIndex: win.z,
            }
      }
    >
      <div
        className="flex h-10 shrink-0 cursor-grab select-none items-center gap-2 border-b border-tsun-border bg-tsun-graphite px-3 active:cursor-grabbing"
        onPointerDown={onHeaderDown}
        onPointerMove={onHeaderMove}
        onPointerUp={onHeaderUp}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <span aria-hidden className="text-tsun-muted">{app.icon}</span>
        <span className="font-mono text-xs tracking-[0.1em] text-tsun-text">{app.title.toUpperCase()}</span>
        {(win.id === "terminal" || win.id === "markets") && <DataBadge state={dataStatus.market} />}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => toggleMinimize(win.id)} className="rounded px-2 py-1 font-mono text-xs text-tsun-muted hover:bg-tsun-panel2 hover:text-tsun-text" aria-label={`Minimize ${app.title}`}>_</button>
          <button onClick={() => toggleMaximize(win.id)} className="rounded px-2 py-1 font-mono text-xs text-tsun-muted hover:bg-tsun-panel2 hover:text-tsun-text" aria-label={`${win.maximized ? "Restore" : "Maximize"} ${app.title}`}>▢</button>
          <button onClick={() => closeApp(win.id)} className="rounded px-2 py-1 font-mono text-xs text-tsun-muted hover:bg-loss/20 hover:text-loss" aria-label={`Close ${app.title}`}>✕</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-tsun-ink">
        <Body />
      </div>
      {!win.maximized && (
        <div
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize text-tsun-dim"
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          aria-hidden
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4"><path d="M4 12 L12 4 M8 12 L12 8" stroke="currentColor" strokeWidth="1.5" /></svg>
        </div>
      )}
    </motion.section>
  );
}

const DESKTOP_ICONS: { id: AppId | "bin"; label: string; icon: string }[] = [
  { id: "terminal", label: "Terminal", icon: ">_" },
  { id: "chat", label: "Talk to TSUN", icon: "◐" },
  { id: "wallet", label: "My Money", icon: "⬡" },
  { id: "x", label: "X//TSUN", icon: "✕" },
  { id: "newspaper", label: "TSUN Times", icon: "¶" },
  { id: "files", label: "Files", icon: "▦" },
  { id: "unlocks", label: "Unlocks", icon: "◬" },
  { id: "bin", label: "Recycle Bin", icon: "🗑" },
];

export function DesktopArea() {
  const windows = useTsunStore((s) => s.windows);
  const openApp = useTsunStore((s) => s.openApp);
  const pushNotice = useTsunStore((s) => s.pushNotice);

  return (
    <div className="desktop-grid relative min-h-0 flex-1 overflow-hidden bg-tsun-void">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(229,72,111,0.06),transparent_55%)]" aria-hidden />
      <div className="absolute left-4 top-4 z-10 grid w-24 gap-1" role="list" aria-label="Desktop icons">
        {DESKTOP_ICONS.map((icon) => (
          <button
            key={icon.id}
            role="listitem"
            onDoubleClick={() => {
              if (icon.id === "bin") {
                pushNotice({ title: "RECYCLE BIN", body: "Empty. Like your trading journal.", kind: "character" });
              } else {
                openApp(icon.id as AppId);
              }
            }}
            onClick={() => {
              if (icon.id === "bin") {
                pushNotice({ title: "RECYCLE BIN", body: "Empty. Like your trading journal.", kind: "character" });
              } else {
                openApp(icon.id as AppId);
                playSound("open");
              }
            }}
            className="group flex flex-col items-center gap-1 rounded-md px-1 py-2 transition-colors hover:bg-white/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-tsun-border bg-tsun-panel font-mono text-sm text-tsun-text group-hover:border-tsun-borderLight" aria-hidden>
              {icon.icon}
            </span>
            <span className="text-center font-mono text-[10px] leading-tight text-tsun-muted group-hover:text-tsun-text">{icon.label}</span>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {windows.map((w) => (
          <WindowChrome key={w.id} win={w} />
        ))}
      </AnimatePresence>
      {windows.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="max-w-xs text-center font-mono text-xs leading-relaxed text-tsun-dim">
            Double click an icon. The terminal is the big one. Try to keep up.
          </p>
        </div>
      )}
    </div>
  );
}
