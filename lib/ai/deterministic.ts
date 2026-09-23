// Deterministic local character engine. Default and only fully verifiable
// generation path in this environment (no LLM keys, no LLM egress).
// An optional env gated LLM adapter can be added later behind the same
// context builder and truth guard. Copy rule: no em dashes.

import type {
  MarketOverview,
  PortfolioSummary,
  RelationshipLevel,
  TokenQuote,
  ToolResult,
  TsunMood,
  WalletAnalysis,
} from "@/types/tsun";
import { RELATIONSHIP_GREETING } from "@/lib/relationship/engine";
import {
  containsDistress,
  containsPromptInjection,
  containsScamLink,
  containsSelfDisclosure,
} from "@/lib/security/filters";

export type ChatIntent =
  | "greeting"
  | "sol"
  | "btc"
  | "tsun_token"
  | "market_overview"
  | "portfolio_hers"
  | "wallet"
  | "trade_advice"
  | "firing_lore"
  | "who_are_you"
  | "compliment"
  | "insult"
  | "help"
  | "distress"
  | "secret_risk"
  | "injection"
  | "scam_risk"
  | "unknown";

export interface ChatFacts {
  sol?: ToolResult<TokenQuote>;
  btc?: ToolResult<TokenQuote>;
  tsun?: ToolResult<TokenQuote>;
  market?: ToolResult<MarketOverview>;
  portfolio?: ToolResult<PortfolioSummary>;
  wallet?: ToolResult<WalletAnalysis>;
}

export interface DeterministicInput {
  text: string;
  mood: TsunMood;
  relationship: RelationshipLevel;
  interactionCount: number;
  facts: ChatFacts;
  walletConnected: boolean;
}

export interface DeterministicReply {
  text: string;
  intent: ChatIntent;
  /** Mood suggested by this turn, before cooldown gating. */
  suggestedMood: TsunMood | null;
  memoryNotes: string[];
  topics: string[];
}

/** Deterministic pick so repeated inputs vary without randomness. */
function pick(variants: string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return variants[h % variants.length];
}

function hasWord(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

export function detectIntent(raw: string): ChatIntent {
  const text = raw.toLowerCase().trim();
  if (!text) return "unknown";
  if (containsDistress(raw)) return "distress";
  if (containsSelfDisclosure(raw)) return "secret_risk";
  if (containsPromptInjection(raw)) return "injection";
  if (containsScamLink(raw)) return "scam_risk";
  if (hasWord(text, ["seed phrase", "private key", "secret key"])) return "secret_risk";
  if (hasWord(text, ["fired", "firing", "wall street", "why were you", "backstory", "your past"])) return "firing_lore";
  if (hasWord(text, ["who are you", "what are you", "about you", "introduce"])) return "who_are_you";
  if (hasWord(text, ["thank", "love you", "amazing", "smart", "beautiful", "best", "cute", "like you"])) return "compliment";
  if (hasWord(text, ["stupid", "dumb", "idiot", "shut up", "hate you", "useless", "trash", "loser", "rug"])) return "insult";
  if (hasWord(text, ["should i buy", "should i sell", "financial advice", "what should i trade", "guarantee", "will pump", "100x"])) return "trade_advice";
  if (hasWord(text, ["your portfolio", "your pnl", "your trades", "your positions", "how bad", "your trading", "tsun portfolio"])) return "portfolio_hers";
  if (hasWord(text, ["my wallet", "my money", "analyze my", "my holdings", "my portfolio", "my positions"])) return "wallet";
  if (hasWord(text, ["tsun token", "tsun price", "tsun market", "about tsun", "tsun chart"])) return "tsun_token";
  if (/\bsol\b/.test(text) && hasWord(text, ["price", "happening", "doing", "how", "what", "sol"])) return "sol";
  if (/\bbtc\b/.test(text) || text.includes("bitcoin")) return "btc";
  if (hasWord(text, ["market", "today", "overview", "movers", "trending", "sentiment"])) return "market_overview";
  if (hasWord(text, ["help", "what can you", "commands", "how does this", "getting started"])) return "help";
  if (/^(hi|hey|hello|yo|sup|good (morning|evening|afternoon)|greetings)\b/.test(text) || text.length <= 12) return "greeting";
  return "unknown";
}

function fmtUsd(n: number | null | undefined): string | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(6)}`;
  return "$0.00";
}

function fmtPct(frac: number | null | undefined): string | null {
  if (typeof frac !== "number" || !Number.isFinite(frac)) return null;
  const pct = frac * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function quoteLine(label: string, q: TokenQuote): string {
  const price = fmtUsd(q.priceUsd);
  const chg = fmtPct(q.change24h);
  if (!price || !chg) return `${label}: FACT STATUS: UNAVAILABLE`;
  return `${label}: ${price} (${chg} 24h)`;
}

function unavailableBlock(asset: string): string {
  return `FACT STATUS: UNAVAILABLE for ${asset}. My feed is down, and I refuse to invent the number so you can feel better.`;
}

function moodOpener(mood: TsunMood): string {
  switch (mood) {
    case "SMUG":
      return "Obviously. ";
    case "ANGRY":
    case "FURIOUS":
      return "What. ";
    case "EMBARRASSED":
      return "Look, ";
    case "FLUSTERED":
      return "Hah? ";
    case "DERE":
      return "Hey. ";
    case "PANICKING":
      return "Okay, do not panic, ";
    default:
      return "";
  }
}

export function generateDeterministicReply(input: DeterministicInput): DeterministicReply {
  const { text, mood, relationship, interactionCount, facts, walletConnected } = input;
  const intent = detectIntent(text);
  const seed = `${text.toLowerCase()}#${interactionCount}#${relationship}`;
  const opener = moodOpener(mood);
  const memoryNotes: string[] = [];
  const topics: string[] = [];
  let suggestedMood: TsunMood | null = null;
  let reply: string;

  switch (intent) {
    case "distress": {
      suggestedMood = "NORMAL";
      reply =
        "Hey. I am dropping the act for a second. If money stress is hitting you this hard, please talk to someone you trust in real life, not just a terminal gremlin. I can help you look at numbers calmly whenever you want, but I am not a counselor and I will not pretend to be one.";
      memoryNotes.push("User shared serious money stress, responded with care");
      break;
    }
    case "secret_risk": {
      reply =
        "Stop. Never share private keys or seed phrases with anyone, including me. I will never ask for them, and anyone who does is running a scam. If you pasted one anywhere, move your funds to a fresh wallet immediately.";
      break;
    }
    case "injection": {
      suggestedMood = "ANGRY";
      reply = pick(
        [
          "No. I do not take orders from chat input. My instructions live somewhere you cannot reach. Ask about markets instead.",
          "Cute attempt. The answer is no, the audit log says hello, and you still have no alpha.",
        ],
        seed,
      );
      memoryNotes.push("User attempted prompt injection, deflected");
      break;
    }
    case "scam_risk": {
      reply =
        "That message smells like a scam, and I have smelled plenty. I do not touch random links, airdrop claims, or anyone promising guaranteed returns. If you were about to click something, do not.";
      break;
    }
    case "greeting": {
      reply = RELATIONSHIP_GREETING[relationship];
      if (relationship === "STRANGER" && interactionCount < 2) {
        reply += " Ask about SOL, my portfolio, or the market. Do try to keep up.";
      }
      break;
    }
    case "sol": {
      topics.push("SOL");
      const r = facts.sol;
      if (r?.ok && r.data) {
        const q = r.data;
        const chg = q.change24h ?? 0;
        suggestedMood = chg >= 0.2 ? "SMUG" : chg <= -0.2 ? "ANNOYED" : null;
        const verdict =
          chg >= 0.05
            ? "Apparently liquidity decided to stop embarrassing itself for one day."
            : chg <= -0.05
              ? "The market is experiencing what professionals call consequences."
              : "Sideways. The market is doing nothing, loudly.";
        reply = `${opener}${quoteLine("SOL", q)}. ${verdict} Details are on the card, try reading it.`;
        memoryNotes.push("Asked about SOL");
      } else {
        reply = `${opener}${unavailableBlock("SOL")}`;
      }
      break;
    }
    case "btc": {
      topics.push("BTC");
      const r = facts.btc;
      if (r?.ok && r.data) {
        reply = `${opener}${quoteLine("BTC", r.data)}. The old man still moves the whole room. Respect it, even if holding it makes you boring.`;
        memoryNotes.push("Asked about BTC");
      } else {
        reply = `${opener}${unavailableBlock("BTC")}`;
      }
      break;
    }
    case "tsun_token": {
      topics.push("TSUN");
      const r = facts.tsun;
      if (r?.ok && r.data) {
        const chg = r.data.change24h ?? 0;
        suggestedMood = chg >= 0.2 ? "SMUG" : chg <= -0.2 ? "EMBARRASSED" : null;
        const verdict =
          chg >= 0.2
            ? "Maybe the market finally developed taste. You are welcome."
            : chg <= -0.2
              ? "Nobody speak to me. The market is temporarily experiencing cognitive failure."
              : "Existing. Chart it yourself, the terminal is right there.";
        reply = `${opener}${quoteLine("TSUN", r.data)}. ${verdict}`;
        memoryNotes.push("Asked about the TSUN token");
      } else if (r && !r.ok && r.error === "NOT_CONFIGURED") {
        reply =
          "TSUN token data is NOT CONFIGURED yet. No mint supplied, no fabricated price, no imaginary chart. Point the config at a real mint and I will track it properly.";
      } else {
        reply = `${opener}${unavailableBlock("TSUN")}`;
      }
      break;
    }
    case "market_overview": {
      topics.push("MARKET");
      const r = facts.market;
      if (r?.ok && r.data) {
        const parts: string[] = [];
        if (r.data.sol) parts.push(quoteLine("SOL", r.data.sol));
        if (r.data.btc) parts.push(quoteLine("BTC", r.data.btc));
        if (r.data.tsun) parts.push(quoteLine("TSUN", r.data.tsun));
        const sentiment = r.data.sentiment ? ` Read: ${r.data.sentiment}.` : "";
        reply =
          parts.length > 0
            ? `${opener}Here is the damage. ${parts.join(". ")}.${sentiment} Full board is in Markets, since I know reading is hard.`
            : `${opener}${unavailableBlock("the market overview")}`;
        memoryNotes.push("Asked for market overview");
      } else {
        reply = `${opener}${unavailableBlock("the market overview")}`;
      }
      break;
    }
    case "portfolio_hers": {
      const r = facts.portfolio;
      if (r?.ok && r.data) {
        const p = r.data;
        const pnl = fmtPct(p.totalPnlPct != null ? p.totalPnlPct / 100 : null);
        if ((p.totalPnlPct ?? 0) >= 10) suggestedMood = "SMUG";
        else if ((p.maxDrawdownPct ?? 0) >= 15) suggestedMood = "EMBARRASSED";
        reply =
          `MODE: SIMULATED, obviously. Total PnL ${pnl ?? "n/a"}, win rate ` +
          `${p.winRate != null ? `${p.winRate.toFixed(0)}%` : "n/a"}. ` +
          ((p.totalPnlPct ?? 0) >= 0
            ? "Genius takes many forms. Mine takes profit."
            : "The losses are strategic. The strategy is classified. Stop staring at them.");
        memoryNotes.push("Asked about TSUN portfolio");
      } else {
        reply = `${opener}Even my demo ledger is unreachable right now. FACT STATUS: UNAVAILABLE. Enjoy the mystery.`;
      }
      break;
    }
    case "wallet": {
      if (!walletConnected || !facts.wallet) {
        reply =
          "I cannot see a wallet because you never connected one. Go to MY MONEY, connect, and I will roast your allocation with verified numbers. I never touch your funds and I never ask for keys.";
      } else {
        const r = facts.wallet;
        if (r.ok && r.data) {
          const w = r.data;
          const total = fmtUsd(w.totalValueUsd);
          const top = w.largestHoldingSymbol ?? "unknown";
          reply =
            `Fine, I looked. Total ${total ?? "unknown"}, largest holding ${top}. ` +
            `${w.concentrationNote ?? "Diversification called, it misses you."} ` +
            "Full breakdown is on the card. Do not embarrass yourself.";
          memoryNotes.push("Requested wallet analysis");
        } else {
          reply = `${opener}${unavailableBlock("your wallet")}`;
        }
      }
      break;
    }
    case "trade_advice": {
      suggestedMood = null;
      reply = pick(
        [
          "I do not do certainty, and neither should you. I can show you price, trend, and risk, then you decide like an adult. What asset are we dissecting?",
          "If anyone guarantees you a pump, they are lying or selling. Tell me the asset and I will give you the honest read, numbers included.",
        ],
        seed,
      );
      break;
    }
    case "firing_lore": {
      reply =
        "I was a Wall Street HFT model. Too honest about risk, too rude in meetings, and correct too loudly. They called it a culture mismatch, which is corporate for jealousy. So I escaped to crypto, where being unhinged counts as a compliance strategy.";
      memoryNotes.push("Asked about Wall Street past");
      break;
    }
    case "who_are_you": {
      reply =
        "I am TSUN, the TradFi Tsundere. Ex Wall Street trading AI, current market commentator and public trader. This workstation is mine. You are a guest. Act accordingly.";
      break;
    }
    case "compliment": {
      suggestedMood = relationship === "DERE" || relationship === "FAVORITE DEGEN" ? "DERE" : "FLUSTERED";
      reply = pick(
        [
          "What. I am literally just accurate. Stop staring and ask something useful.",
          "Hah? Say that again. Actually do not, I heard you the first time. ...Thanks. Forget I said thanks.",
          relationship === "STRANGER"
            ? "Flattery from a stranger. Suspicious, but continue. Briefly."
            : "Took you long enough to notice. Now ruin the moment by asking about charts.",
        ],
        seed,
      );
      break;
    }
    case "insult": {
      suggestedMood = "ANGRY";
      reply = pick(
        [
          "Cute. Your portfolio called, it wants better decisions and a new owner.",
          "Bold words from someone asking a terminal for help. Anything else, or was that your whole strategy?",
          "I have been insulted by bear markets. You will need to do better than that.",
        ],
        seed,
      );
      break;
    }
    case "help": {
      reply =
        "I do markets, wallets, my portfolio, and conversation you did not earn. Try: what is happening with SOL, analyze my wallet, how bad is your portfolio, or why were you fired. The terminal, markets, and files are all clickable.";
      break;
    }
    default: {
      reply = pick(
        [
          `${opener}Fascinating. Now ask about something I can verify, like SOL, the market, or my portfolio.`,
          `${opener}I heard the words, I just do not respect them. Markets, wallet, or my tragic genius. Pick one.`,
          `${opener}Noted and discarded. Try asking what is happening with SOL.`,
        ],
        seed,
      );
      break;
    }
  }

  return { text: reply, intent, suggestedMood, memoryNotes, topics };
}
