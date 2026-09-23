// TALK TO TSUN. Flagship feature: stateful character chat with verified
// tool cards, memory persistence, mood and relationship wiring.
"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SectionLabel, TsunAvatar } from "@/components/os/ui";
import { addMemoryNote, getOrCreateMemory, loadConversation, recordInteraction, saveConversation, saveMemory } from "@/lib/memory/store";
import { useTsunStore } from "@/lib/state/store";
import { cn } from "@/lib/utils";
import type { ChatMessage, RelationshipLevel, ToolCardData, TsunMood } from "@/types/tsun";

const STARTERS = [
  "What is happening with SOL?",
  "Analyze my wallet.",
  "How bad is your portfolio?",
  "Why were you fired?",
  "What do you think about TSUN?",
  "Show me today's market.",
];

interface ChatApiResponse {
  text: string;
  intent: string;
  suggestedMood: TsunMood | null;
  toolCard?: ToolCardData;
  memoryNotes: string[];
  topics: string[];
}

function typingLabelsFor(text: string, relationship: RelationshipLevel): string[] {
  const t = text.toLowerCase();
  if (t.includes("wallet") || t.includes("my money") || t.includes("holdings")) return ["CHECKING YOUR WALLET...", "TSUN IS THINKING..."];
  if (t.includes("sol") || t.includes("btc") || t.includes("market") || t.includes("price") || t.includes("tsun")) {
    return ["FETCHING MARKET DATA...", "TSUN IS THINKING..."];
  }
  const rare = relationship === "TOLERABLE HUMAN" || relationship === "FAVORITE DEGEN" || relationship === "DERE";
  return rare && text.length % 7 === 0 ? ["PRETENDING NOT TO CARE...", "TSUN IS THINKING..."] : ["TSUN IS THINKING..."];
}

function ToolCard({ card }: { card: ToolCardData }) {
  return (
    <div className="mt-2 rounded-md border border-tsun-border bg-tsun-void p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.14em] text-tsun-muted">{card.title}</span>
        <span className="font-mono text-[10px] text-tsun-dim">{card.state.toUpperCase()}</span>
      </div>
      <div className="mt-2 space-y-1">
        {card.rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between font-mono text-xs">
            <span className="text-tsun-muted">{r.label}</span>
            <span className="text-tsun-text">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 font-mono text-[10px] text-tsun-dim">
        {card.source} · {card.freshness}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "system") {
    return <div className="py-1 text-center font-mono text-[11px] tracking-wide text-tsun-dim">{msg.text}</div>;
  }
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-br-sm border border-tsun-border bg-tsun-panel2 px-3 py-2 text-sm text-tsun-text">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-lg rounded-bl-sm border border-tsun-border bg-tsun-panel px-3 py-2">
        <div className="font-mono text-[10px] tracking-[0.14em] text-tsun-accent">
          TSUN{msg.mood ? ` / ${msg.mood}` : ""}
        </div>
        <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-tsun-text">{msg.text}</div>
        {msg.toolCard && <ToolCard card={msg.toolCard} />}
      </div>
    </div>
  );
}

function newId(): string {
  return `msg-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export default function ChatApp() {
  const mood = useTsunStore((s) => s.mood);
  const relationship = useTsunStore((s) => s.relationship);
  const currentQuote = useTsunStore((s) => s.currentQuote);
  const interactionCount = useTsunStore((s) => s.interactionCount);
  const requestMood = useTsunStore((s) => s.requestMood);
  const addRelationship = useTsunStore((s) => s.addRelationship);
  const bumpInteraction = useTsunStore((s) => s.bumpInteraction);
  const dataStatus = useTsunStore((s) => s.dataStatus);
  const { publicKey } = useWallet();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typingLabel, setTypingLabel] = useState("TSUN IS THINKING...");
  const [infoOpen, setInfoOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const prev = loadConversation();
    if (prev.length > 0) {
      setMessages(prev);
    } else {
      const greet: ChatMessage = {
        id: newId(),
        role: "tsun",
        text: "You made it to my terminal. State your business. Markets, wallets, my portfolio, or my tragic backstory. Pick one.",
        createdAt: new Date().toISOString(),
        mood: useTsunStore.getState().mood,
      };
      setMessages([greet]);
      saveConversation([greet]);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  // Rotate typing labels while waiting.
  useEffect(() => {
    if (!sending) return;
    const labels = typingLabelsFor(input, relationship);
    setTypingLabel(labels[0]);
    if (labels.length < 2) return;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTypingLabel(labels[i % labels.length]);
    }, 1400);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;
    const userMsg: ChatMessage = { id: newId(), role: "user", text: text.slice(0, 2000), createdAt: new Date().toISOString() };
    const next = [...messages, userMsg];
    setMessages(next);
    saveConversation(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          mood,
          relationship,
          interactionCount,
          walletAddress: publicKey?.toBase58() ?? null,
          userId: getOrCreateMemory().userId,
        }),
      });
      if (!res.ok) throw new Error(`chat failed: ${res.status}`);
      const data = (await res.json()) as ChatApiResponse;
      const reply: ChatMessage = {
        id: newId(),
        role: "tsun",
        text: data.text,
        createdAt: new Date().toISOString(),
        mood: data.suggestedMood ?? mood,
        toolCard: data.toolCard,
      };
      const withReply = [...next, reply];
      setMessages(withReply);
      saveConversation(withReply);
      // Character state updates.
      if (data.suggestedMood) requestMood(data.suggestedMood, `chat intent ${data.intent}`);
      bumpInteraction();
      addRelationship("message");
      if (data.topics.length > 0) addRelationship("meaningful");
      if (data.intent === "compliment") addRelationship("compliment");
      if (data.intent === "insult") addRelationship("mockery");
      // Memory persistence.
      let mem = getOrCreateMemory();
      mem = recordInteraction(mem, { topics: data.topics, score: useTsunStore.getState().score });
      for (const note of data.memoryNotes.slice(0, 3)) mem = addMemoryNote(mem, note);
      saveMemory(mem);
    } catch {
      const err: ChatMessage = {
        id: newId(),
        role: "tsun",
        text: "My brain disconnected from my mouth. The chat backend is unreachable right now. Try again in a moment, and no, I will not guess what I was about to say.",
        createdAt: new Date().toISOString(),
        mood: "ANNOYED",
      };
      const withErr = [...next, err];
      setMessages(withErr);
      saveConversation(withErr);
    } finally {
      setSending(false);
    }
  };

  const showStarters = messages.length <= 1 && !sending;

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      {/* Status strip */}
      <div className="flex shrink-0 items-center gap-3 border-b border-tsun-border bg-tsun-graphite px-3 py-2">
        <TsunAvatar mood={mood} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-[11px] tracking-[0.12em] text-tsun-text">
            TSUN <span className="text-tsun-dim">/ {mood} / {relationship}</span>
          </div>
          <div className="truncate text-xs text-tsun-muted">“{currentQuote}”</div>
        </div>
        <span className="hidden font-mono text-[10px] text-tsun-dim sm:inline">
          DATA: {dataStatus.market.toUpperCase()}
        </span>
        <button
          onClick={() => setInfoOpen((v) => !v)}
          className="rounded px-2 py-1 font-mono text-[11px] text-tsun-muted hover:text-tsun-text md:hidden"
          aria-expanded={infoOpen}
        >
          INFO
        </button>
      </div>
      {infoOpen && (
        <div className="border-b border-tsun-border bg-tsun-panel px-3 py-2 text-xs text-tsun-muted md:hidden">
          Mood {mood} · {relationship} · {interactionCount} interactions. She remembers you. Unfortunately for you.
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Side panel, desktop only */}
        <aside className="hidden w-52 shrink-0 flex-col gap-3 overflow-auto border-r border-tsun-border bg-tsun-graphite/60 p-3 md:flex">
          <TsunAvatar mood={mood} size={72} />
          <div>
            <SectionLabel>Mood</SectionLabel>
            <div className="mt-0.5 font-mono text-sm text-tsun-text">{mood}</div>
          </div>
          <div>
            <SectionLabel>Relationship</SectionLabel>
            <div className="mt-0.5 text-sm text-tsun-text">{relationship}</div>
            <div className="font-mono text-[11px] text-tsun-dim">{interactionCount} interactions</div>
          </div>
          <div>
            <SectionLabel>Live data</SectionLabel>
            <div className="mt-0.5 font-mono text-[11px] text-tsun-muted">
              MARKET {dataStatus.market.toUpperCase()}
              <br />
              RPC {dataStatus.solanaRpc.toUpperCase()}
            </div>
          </div>
          <p className="mt-auto font-mono text-[11px] leading-relaxed text-tsun-dim">
            Facts come from verified tools. Jokes come from trauma.
          </p>
        </aside>

        {/* Conversation */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-3" aria-live="polite">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {sending && (
            <div className="font-mono text-[11px] tracking-[0.14em] text-tsun-muted" role="status">
              {typingLabel}
            </div>
          )}
          {showStarters && (
            <div className="grid gap-2 pt-2 sm:grid-cols-2">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  onClick={() => void send(q)}
                  className={cn(
                    "rounded-md border border-tsun-border bg-tsun-panel px-3 py-2.5 text-left text-xs text-tsun-text",
                    "transition-colors hover:border-tsun-borderLight hover:bg-tsun-panel2",
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form
        className="flex shrink-0 items-end gap-2 border-t border-tsun-border bg-tsun-graphite p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">Ask TSUN something</label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          placeholder="Ask TSUN something..."
          maxLength={2000}
          className="max-h-28 min-h-[40px] flex-1 resize-none rounded-md border border-tsun-border bg-tsun-void px-3 py-2 text-sm text-tsun-text placeholder:text-tsun-dim focus:border-tsun-borderLight focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-md bg-tsun-text px-4 py-2.5 text-xs font-bold text-black transition-all active:translate-y-px disabled:opacity-40"
        >
          SEND
        </button>
      </form>
    </div>
  );
}
