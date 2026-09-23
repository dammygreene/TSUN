import { Activity, ArrowUp, AtSign, CheckCircle2, CircleAlert, Database, SendHorizontal, ShieldCheck, Sparkles, X } from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { STARTER_PROMPTS } from '../data'
import { cn, formatCurrency, formatPercent, formatRelativeTime } from '../lib/format'
import { runDeskCheck } from '../lib/tasks'
import type { ChatMessage, MarketState, RelationshipLevel, TokenState, TsunMood, UserMemory, WalletState } from '../types'
import type { ModelStatus, ProviderInfo, ProvidersResponse } from '../lib/providers'
import { Avatar } from './Avatar'

interface ChatProps {
  messages: ChatMessage[]
  mood: TsunMood
  memory: UserMemory
  sending: boolean
  onSend: (value: string) => void
  market: MarketState
  token: TokenState
  wallet: WalletState
  providers: ProvidersResponse
  providerStatus: ModelStatus
  lastReply: ProviderInfo | null
}

function ToolCard({ message }: { message: ChatMessage }) {
  const card = message.toolCard
  if (!card) return null
  const hasPrice = typeof card.price === 'number'
  const hasError = Boolean(card.error)
  return (
    <div className={cn('tool-card', hasError && 'tool-card-error')}>
      <div className="tool-card-top"><span><Database size={13} /> {card.label}</span><span>{card.source ?? 'SYSTEM'}</span></div>
      <div className="tool-card-main">
        <strong>{card.symbol}</strong>
        {hasPrice && <b>{formatCurrency(card.price)}</b>}
        {card.value && <b>{card.value}</b>}
        {typeof card.change === 'number' && <em className={card.change >= 0 ? 'positive' : 'negative'}>{formatPercent(card.change)}</em>}
      </div>
      <div className="tool-card-foot"><span>{hasError ? card.error : `Updated ${formatRelativeTime(card.updatedAt)}`}</span>{!hasError && <span>VERIFIED CONTEXT</span>}</div>
    </div>
  )
}

function relationshipDescription(relationship: RelationshipLevel) {
  const copy: Record<RelationshipLevel, string> = {
    STRANGER: 'No established context.',
    'ANNOYING TRADER': 'Recognized. Not forgiven.',
    REGULAR: 'Returns often enough to be remembered.',
    'TOLERABLE HUMAN': 'Has shown basic persistence.',
    'FAVORITE DEGEN': 'Predictable, against TSUN better judgment.',
    DERE: 'Rare trusted context unlocked.',
  }
  return copy[relationship]
}

/** TSUN flavoured waiting states. The rare ones only appear once she has warmed up a bit. */
function thinkingLine(memory: UserMemory, providers: ProvidersResponse) {
  const level = memory.interactionCount
  const pool = [
    'TSUN IS CHECKING THE RELEVANT FACTS...',
    'FETCHING MARKET DATA...',
    'VERIFYING THE TAPE...',
    'RECALCULATING SOMETHING SHE WILL NOT ADMIT TO...',
  ]
  if (level >= 6) pool.push('PRETENDING NOT TO CARE...')
  if (level >= 20) pool.push('DECIDING WHETHER YOU DESERVE A REAL ANSWER...')
  if (!providers.openrouter.configured && !providers.gemini.configured) pool.push('RUNNING ON THE LOCAL CHARACTER ENGINE...')
  const seed = Math.floor(Date.now() / 9000) + memory.interactionCount
  return pool[seed % pool.length]
}

function modelLabel(status: ModelStatus, providers: ProvidersResponse, lastReply: ProviderInfo | null) {
  if (status === 'checking') return { text: 'CHECKING MODEL LINK', tone: 'pending' }
  if (status === 'local') {
    return {
      text: providers.openrouter.configured || providers.gemini.configured ? 'LOCAL ENGINE ACTIVE' : 'LOCAL MODEL LINK',
      tone: 'local',
    }
  }
  if (status === 'degraded') return { text: `GEMINI FALLBACK${lastReply ? ` / ${lastReply.model}` : ''}`, tone: 'fallback' }
  return { text: `OPENROUTER${lastReply?.provider === 'openrouter' ? ` / ${lastReply.model}` : ''}`, tone: 'primary' }
}

export function Chat({ messages, mood, memory, sending, onSend, market, token, wallet, providers, providerStatus, lastReply }: ChatProps) {
  const [input, setInput] = useState('')
  const [tasksOpen, setTasksOpen] = useState(false)
  const [taskRun, setTaskRun] = useState<ReturnType<typeof runDeskCheck> | null>(null)
  const [revealedTask, setRevealedTask] = useState<string | null>(null)
  const messageEnd = useRef<HTMLDivElement>(null)
  const typing = useMemo(() => thinkingLine(memory, providers), [memory, providers])
  const link = modelLabel(providerStatus, providers, lastReply)

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, sending])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = input.trim()
    if (!value || sending) return
    setInput('')
    onSend(value)
  }

  const runTasks = () => {
    setTasksOpen(true)
    setRevealedTask(null)
    setTaskRun(runDeskCheck({ market, token, wallet, memory, mood }))
  }

  const tsunMessages = messages.filter((message) => message.role === 'tsun').length

  return (
    <div className="chat-view">
      <aside className="chat-identity-panel">
        <Avatar mood={mood} imagePath="/tsun_core.jpg" bare />
        <div className="identity-stat-grid">
          <div><span>MOOD</span><strong>{mood}</strong></div>
          <div><span>RELATIONSHIP</span><strong>{memory.relationship}</strong></div>
        </div>
        <p>{relationshipDescription(memory.relationship)}</p>
        <div className="memory-mini"><AtSign size={13} /><span>{memory.interactionCount} local interaction{memory.interactionCount === 1 ? '' : 's'}</span></div>
        <div className="memory-mini"><Activity size={13} /><span>{tsunMessages} repl{tsunMessages === 1 ? 'y' : 'ies'} logged</span></div>
      </aside>

      <section className="conversation-panel">
        <div className="conversation-header">
          <div><span className="eyebrow">DIRECT CHANNEL</span><h2>Talk to TSUN</h2></div>
          <div className="chat-header-side">
            <button type="button" className={cn('model-pill', `model-${link.tone}`)} onClick={runTasks} title="Model link status. Click to run a desk check.">
              <span className="status-dot" />
              {link.text}
            </button>
            <div className="chat-safety"><ShieldCheck size={14} /><span>NO CUSTODY</span></div>
          </div>
        </div>

        {tasksOpen && taskRun && (
          <div className="task-monitor" role="dialog" aria-label="TSUN desk check">
            <div className="task-monitor-head">
              <span className="eyebrow">TSUN//DIAGNOSTICS</span>
              <button type="button" className="task-close" onClick={() => setTasksOpen(false)} aria-label="Close desk check"><X size={13} /></button>
            </div>
            <p className="task-monitor-note">She ran the checks without being asked. Again.</p>
            <div className="task-list">
              {taskRun.tasks.map((task) => (
                <button type="button" key={task.id} className={cn('task-row', !task.ok && 'task-row-flagged')} onClick={() => setRevealedTask(revealedTask === task.id ? null : task.id)}>
                  <span className="task-row-main">
                    {task.ok ? <CheckCircle2 size={13} /> : <CircleAlert size={13} />}
                    <strong>{task.label}</strong>
                    <em>{task.detail}</em>
                  </span>
                  {revealedTask === task.id && <span className="task-quip">{task.quip}</span>}
                </button>
              ))}
            </div>
            <div className={cn('task-verdict', taskRun.degraded && 'task-verdict-degraded')}>
              <Sparkles size={13} />
              <span>{taskRun.verdict}</span>
            </div>
          </div>
        )}

        <div className="message-list" aria-live="polite">
          {messages.map((message) => (
            <article key={message.id} className={cn('chat-message', `message-${message.role}`)}>
              {message.role === 'tsun' && <div className="message-meta">TSUN / {message.mood ?? mood}</div>}
              {message.role === 'system' && <div className="message-meta">TSUN//SYSTEM</div>}
              <p>{message.body}</p>
              <ToolCard message={message} />
            </article>
          ))}
          {messages.length <= 1 && !sending && (
            <div className="starter-prompts">
              <span>START A CONVERSATION</span>
              <div>{STARTER_PROMPTS.map((prompt) => <button type="button" key={prompt} onClick={() => onSend(prompt)}>{prompt}<ArrowUp size={13} /></button>)}</div>
            </div>
          )}
          {sending && (
            <div className="chat-thinking"><span className="status-dot loading" /> <span>{typing}</span></div>
          )}
          <div ref={messageEnd} />
        </div>

        <form className="chat-compose" onSubmit={submit}>
          <label className="sr-only" htmlFor="tsun-message">Ask TSUN something</label>
          <input
            id="tsun-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask TSUN something..."
            autoComplete="off"
          />
          <button type="submit" disabled={!input.trim() || sending} aria-label="Send message"><SendHorizontal size={17} /></button>
        </form>
        <div className="compose-note">Local browser memory only. Model replies run server side, so keys never touch this page. Never submit seed phrases or secrets.</div>
      </section>
    </div>
  )
}
