import { ArrowUp, Bot, Database, SendHorizontal, ShieldCheck } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { STARTER_PROMPTS } from '../data'
import { cn, formatCurrency, formatPercent, formatRelativeTime } from '../lib/format'
import type { ChatMessage, RelationshipLevel, TsunMood, UserMemory } from '../types'
import { Avatar } from './Avatar'

interface ChatProps {
  messages: ChatMessage[]
  mood: TsunMood
  memory: UserMemory
  sending: boolean
  typingLabel?: string
  onSend: (value: string) => void
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
    'FAVORITE DEGEN': 'Predictable, against TSUN’s better judgment.',
    DERE: 'Rare trusted context unlocked.',
  }
  return copy[relationship]
}

export function Chat({ messages, mood, memory, sending, typingLabel = 'TSUN IS THINKING...', onSend }: ChatProps) {
  const [input, setInput] = useState('')
  const messageEnd = useRef<HTMLDivElement>(null)

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

  return (
    <div className="chat-view">
      <aside className="chat-identity-panel">
        <Avatar mood={mood} imagePath="/tsun_chat.jpeg" bare />
        <div className="identity-stat-grid">
          <div><span>MOOD</span><strong>{mood}</strong></div>
          <div><span>RELATIONSHIP</span><strong>{memory.relationship}</strong></div>
        </div>
        <p>{relationshipDescription(memory.relationship)}</p>
        <div className="memory-mini"><Bot size={14} /><span>{memory.interactionCount} local interaction{memory.interactionCount === 1 ? '' : 's'}</span></div>
      </aside>

      <section className="conversation-panel">
        <div className="conversation-header">
          <div><span className="eyebrow">DIRECT CHANNEL</span><h2>Talk to TSUN</h2></div>
          <div className="chat-safety"><ShieldCheck size={14} /><span>NO CUSTODY</span></div>
        </div>
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
            <div className="chat-thinking"><span className="status-dot loading" /> <span>{typingLabel}</span></div>
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
        <div className="compose-note">Messages are sent to TSUN chat providers (OpenRouter, Gemini fallback) when configured. Local memory stays in this browser. Never submit keys, seed phrases, or secrets.</div>
      </section>
    </div>
  )
}
