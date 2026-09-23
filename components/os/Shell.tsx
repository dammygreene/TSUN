// TSUN//OS shell orchestrator: boot, market polling, event wiring,
// desktop and mobile layouts.
"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { BootScreen } from "@/components/os/BootScreen";
import { DesktopArea } from "@/components/os/WindowManager";
import { TopBar } from "@/components/os/TopBar";
import { Taskbar } from "@/components/os/Taskbar";
import { MobileNav } from "@/components/os/MobileNav";
import { MajorEventOverlay, NotificationStack } from "@/components/os/Notifications";
import { appById } from "@/components/os/registry";
import { emit, evaluateMarketEvents, makeEvent, subscribe } from "@/lib/events/bus";
import { toDataState } from "@/lib/market/providers";
import { loadMemory } from "@/lib/memory/store";
import { playSound, setSoundEnabled } from "@/lib/sound/engine";
import { rehydrateTsunStore, useTsunStore, type AppId } from "@/lib/state/store";
import type { MarketOverview, TokenQuote, ToolResult } from "@/types/tsun";

interface MarketApiResponse {
  market: ToolResult<MarketOverview>;
}

async function pollMarket(): Promise<MarketApiResponse | null> {
  try {
    const res = await fetch("/api/market", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as MarketApiResponse;
  } catch {
    return null;
  }
}

export function Shell() {
  const booted = useTsunStore((s) => s.booted);
  const openApp = useTsunStore((s) => s.openApp);
  const setActiveMobileApp = useTsunStore((s) => s.setActiveMobileApp);
  const activeMobileApp = useTsunStore((s) => s.activeMobileApp);
  const soundOn = useTsunStore((s) => s.soundOn);
  const prevToken = useRef<TokenQuote | null>(null);
  const prevSol = useRef<TokenQuote | null>(null);
  const prevBtc = useRef<TokenQuote | null>(null);
  const openedDefault = useRef(false);

  // Rehydrate persisted state once, then wire the event bus.
  useEffect(() => {
    rehydrateTsunStore();
    const unsub = subscribe((e) => {
      useTsunStore.getState().recordEvent(e);
      if (e.severity >= 3) playSound("milestone");
      else if (e.severity === 2) playSound("notify");
    });
    return unsub;
  }, []);

  // Sound engine follows the settings toggle. Off by default.
  useEffect(() => {
    setSoundEnabled(soundOn);
  }, [soundOn]);

  // Detect returning users for the relationship engine.
  useEffect(() => {
    if (!booted) return;
    try {
      const mem = loadMemory();
      if (mem && mem.interactionCount > 0) {
        const gapMs = Date.now() - new Date(mem.lastSeenAt).getTime();
        if (Number.isFinite(gapMs) && gapMs > 6 * 3_600_000) {
          useTsunStore.getState().addRelationship("return_visit");
          emit(
            makeEvent({
              type: "USER_RETURNED",
              severity: 2,
              title: "USER RETURNED",
              body: "You disappeared. I did not notice. The chat was just quieter.",
              linkedApp: "chat",
            }),
          );
        }
      }
    } catch {
      /* memory unavailable, skip */
    }
  }, [booted]);

  // Market polling loop, every 30s. Drives the ticker, mood, milestones.
  useEffect(() => {
    if (!booted) return;
    let cancelled = false;
    const tick = async () => {
      const api = await pollMarket();
      if (cancelled || !api) {
        if (!cancelled) {
          useTsunStore.getState().setDataStatus({ market: "error", tsunToken: "error" });
        }
        return;
      }
      const st = useTsunStore.getState();
      const r = api.market;
      if (r.ok && r.data) {
        st.setMarket(r.data);
        st.ingestTokenQuote(r.data.tsun);
        st.setDataStatus({ market: r.stale ? "stale" : "loaded", tsunToken: r.data.tsun ? "loaded" : "unavailable" });
        for (const e of evaluateMarketEvents(prevToken.current, r.data.tsun)) emit(e);
        for (const e of evaluateMarketEvents(prevSol.current, r.data.sol)) emit(e);
        for (const e of evaluateMarketEvents(prevBtc.current, r.data.btc)) emit(e);
        prevToken.current = r.data.tsun;
        prevSol.current = r.data.sol;
        prevBtc.current = r.data.btc;
        // Feed mood from verified moves.
        const chg = r.data.tsun?.change24h;
        if (typeof chg === "number") {
          if (chg >= 0.2) st.requestMood("SMUG", `TSUN up ${(chg * 100).toFixed(1)}%`);
          else if (chg <= -0.4) st.requestMood("PANICKING", `TSUN down ${(chg * 100).toFixed(1)}%`);
          else if (chg <= -0.2) st.requestMood("ANNOYED", `TSUN down ${(chg * 100).toFixed(1)}%`);
        }
      } else {
        st.setDataStatus({ market: toDataState(r), tsunToken: r.error === "NOT_CONFIGURED" ? "unavailable" : "error" });
      }
    };
    void tick();
    const t = setInterval(() => void tick(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [booted]);

  // Open the default desk after first boot.
  useEffect(() => {
    if (!booted || openedDefault.current) return;
    openedDefault.current = true;
    openApp("terminal");
    useTsunStore.getState().pushNotice({
      title: "DESK READY",
      body: "Terminal is open. Chat is one click away. Do not embarrass yourself.",
      kind: "system",
    });
  }, [booted, openApp]);

  const openFromBar = (app: AppId) => {
    openApp(app);
    setActiveMobileApp(app);
  };

  if (!booted) {
    return (
      <div className="h-dvh w-full bg-tsun-void text-tsun-text">
        <AnimatePresence>{!booted && <BootScreen key="boot" />}</AnimatePresence>
      </div>
    );
  }

  const MobileApp = appById(activeMobileApp).component;

  return (
    <div className="h-dvh w-full bg-tsun-void text-tsun-text">
      {/* Desktop shell */}
      <div className="hidden h-full flex-col md:flex">
        <TopBar onOpenApp={openFromBar} />
        <DesktopArea />
        <Taskbar />
      </div>
      {/* Mobile shell: full screen apps, no window dragging */}
      <div className="relative flex h-full flex-col md:hidden">
        <TopBar onOpenApp={openFromBar} />
        <main className="min-h-0 flex-1 overflow-auto bg-tsun-void" aria-label={appById(activeMobileApp).title}>
          <MobileApp />
        </main>
        <MobileNav />
      </div>
      <NotificationStack />
      <MajorEventOverlay />
    </div>
  );
}
