// Sound hooks: tiny synthesized WebAudio blips, no assets. Always off by
// default, enabled only via the settings toggle. Respects reduced motion by
// silencing ambient ticks (callers decide what is ambient).
"use client";

export type SoundKind = "open" | "send" | "message" | "notify" | "error" | "milestone";

let enabled = false;
let ctx: AudioContext | null = null;

export function setSoundEnabled(v: boolean): void {
  enabled = v;
  if (!v && ctx) {
    void ctx.close().catch(() => undefined);
    ctx = null;
  }
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

function tone(freq: number, durMs: number, delayMs = 0, type: OscillatorType = "sine", gain = 0.035): void {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delayMs / 1000;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durMs / 1000 + 0.05);
}

export function playSound(kind: SoundKind): void {
  if (!enabled) return;
  try {
    switch (kind) {
      case "open":
        tone(660, 70);
        break;
      case "send":
        tone(520, 60);
        break;
      case "message":
        tone(740, 80);
        break;
      case "notify":
        tone(880, 70);
        tone(660, 90, 90);
        break;
      case "error":
        tone(160, 160, 0, "square", 0.03);
        break;
      case "milestone":
        tone(523, 120);
        tone(659, 120, 110);
        tone(784, 200, 220);
        break;
    }
  } catch {
    /* sound must never break the UI */
  }
}
