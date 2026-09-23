import { Camera, CircleAlert, Coffee, Flame, Link2, Phone, PhoneOff, Pizza, Play, Radio, SkipForward, Square, Volume2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '../lib/format'
import type { MarketState, TokenState, TsunMood } from '../types'

interface DeskProps {
  market: MarketState
  token: TokenState
  mood: TsunMood
  onToast: (title: string, body: string) => void
  onOpenChat: () => void
}

type OperatorState = 'IDLE' | 'ON A CALL' | 'STARING AT SOL' | 'PRETENDING TO WORK'

interface Operator {
  name: string
  desk: string
  state: OperatorState
}

/** Names only. Every number on this screen is labelled fictional on purpose. */
const ROSTER: Operator[] = [
  { name: 'Nicky K.', desk: 'SOL BOOK', state: 'IDLE' },
  { name: 'Robbie F.', desk: 'MEME DESK', state: 'PRETENDING TO WORK' },
  { name: 'Alden K.', desk: 'FUNDING', state: 'STARING AT SOL' },
  { name: 'Chester M.', desk: 'RISK', state: 'ON A CALL' },
  { name: 'Toby W.', desk: 'LIQUIDITY', state: 'IDLE' },
  { name: 'Kimmie B.', desk: 'TAPE READING', state: 'STARING AT SOL' },
  { name: 'Stevie 2-Phones', desk: 'OUTREACH', state: 'ON A CALL' },
]

const ACTIONS: Array<{ id: string; label: string; icon: typeof Flame; line: string }> = [
  { id: 'motivate', label: 'Motivate', icon: Flame, line: 'Motivation deployed. Productivity unchanged. Morale briefly up.' },
  { id: 'pizza', label: 'Pizza', icon: Pizza, line: 'Pizza ordered. Two desks claim it was their idea. Both are wrong.' },
  { id: 'drill', label: 'Drill', icon: Coffee, line: 'Drill complete. Nobody can define the risk metric. Moving on.' },
]

/**
 * A fictional trading floor camera. Deliberately generates no numbers: the point is atmosphere, not
 * invented performance. Where a figure would normally sit, it says so.
 */
export function FloorMonitorApp({ market, token, mood, onToast, onOpenChat }: DeskProps) {
  const [log, setLog] = useState<string[]>([
    'CAM 01 online. Rule 1 applies: nothing on this floor is a verified figure.',
  ])
  const [rounds, setRounds] = useState(0)

  const push = (line: string) => setLog((current) => [...current.slice(-6), line])

  const runAction = (action: (typeof ACTIONS)[number]) => {
    push(action.line)
    onToast('TSUN//FLOOR', action.line)
  }

  const feedLine = market.status === 'live'
    ? `SOL tape live from ${market.source}. The floor is still guessing.`
    : 'Market feed is unavailable. The floor has decided to have opinions anyway.'
  const tokenLine = token.address
    ? token.status === 'live' ? `TSUN pair verified: ${token.pairLabel ?? 'TSUN / SOL'}. Do not celebrate in the building.` : 'TSUN pair feed unavailable. Nobody is allowed to make up the number.'
    : 'TSUN contract is not configured, so the big board stays blank. That is the honest outcome.'

  return (
    <div className="floor-monitor app-scroll">
      <header className="floor-head">
        <div>
          <span className="eyebrow">FLOOR MONITOR / CAM 01</span>
          <h1>Sales Floor 1</h1>
        </div>
        <div className="floor-badges">
          <span className={cn('floor-live', market.status !== 'live' && 'floor-live-off')}><Camera size={13} /> {market.status === 'live' ? 'FEED LIVE' : 'FEED OFFLINE'}</span>
          <span className="floor-mood">MOOD {mood}</span>
        </div>
      </header>

      <div className="floor-bar">
        <span>DAILY QUOTA</span>
        <div className="floor-bar-track"><i style={{ width: `${Math.min(96, rounds * 12)}%` }} /></div>
        <b>{rounds === 0 ? 'AWAITING A VERIFIED SOURCE' : 'STILL FICTIONAL, STILL NOT REAL'}</b>
      </div>

      <div className="floor-actions">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return <button type="button" key={action.id} onClick={() => { setRounds((value) => value + 1); runAction(action) }}><Icon size={14} /> {action.label}</button>
        })}
        <button type="button" onClick={() => { push('You asked the floor for numbers. The floor asked for a source.'); onOpenChat() }}><Link2 size={14} /> Call TSUN</button>
      </div>

      <div className="floor-table" role="table" aria-label="Fictional floor roster">
        <div className="floor-row floor-row-head" role="row"><span>OPERATOR</span><span>DESK</span><span>STATUS</span><span>VERIFIED PNL</span></div>
        {ROSTER.map((operator) => (
          <div className="floor-row" role="row" key={operator.name}>
            <span>{operator.name}</span>
            <span>{operator.desk}</span>
            <span className={cn('floor-status', operator.state === 'ON A CALL' && 'floor-status-busy')}>{operator.state}</span>
            <span className="floor-null">N/A, PROVIDER REQUIRED</span>
          </div>
        ))}
      </div>

      <div className="floor-log">
        {log.map((line, index) => <p key={`${line}-${index}`}><Radio size={12} /> {line}</p>)}
      </div>

      <div className="floor-foot">
        <CircleAlert size={14} />
        <div>
          <strong>Every operator, desk and event behind this window is fictional scaffolding.</strong>
          <p>{feedLine} {tokenLine}</p>
        </div>
      </div>
    </div>
  )
}

const TRACKS = [
  { title: 'CHEST_BUMP.MP3', length: '--:--', note: 'Filed under: things that never happened.' },
  { title: 'tsuno_mix.mp3', length: '--:--', note: 'There is no soundtrack. Focus.' },
  { title: 'CLOSING_BELL.MP3', length: '--:--', note: 'Do not get sentimental about the bell.' },
  { title: 'HUMILITY.MP3', length: '00:00', note: 'File corrupted on arrival.' },
]

/** A media player that refuses to pretend it is playing audio. */
export function MediaPlayerApp() {
  const [index, setIndex] = useState(1)
  const [playing, setPlaying] = useState(false)
  const track = TRACKS[index]

  return (
    <div className="mixer app-scroll">
      <header className="mixer-head">
        <div><span className="eyebrow">TSUN//MEDIA</span><h1>Media Player</h1></div>
        <span className="mixer-device"><Volume2 size={14} /> AUDIO DEVICE: {playing ? 'STILL NOT CONNECTED' : 'NOT CONNECTED'}</span>
      </header>

      <div className="mixer-screen">
        <div className="mixer-note">
          <span>{playing ? 'NOW PLAYING' : 'NOW NOT PLAYING'}</span>
          <strong>{track.title}</strong>
          <em>{track.length}</em>
        </div>
        <div className={cn('mixer-bars', playing && 'mixer-bars-live')} aria-hidden="true">
          {Array.from({ length: 26 }).map((_, bar) => <i key={bar} style={{ animationDelay: `${(bar % 9) * 0.09}s`, height: `${18 + ((bar * 37) % 62)}%` }} />)}
        </div>
        <p className="mixer-caption">{playing ? '"The device is decorative. The enthusiasm is also decorative."' : '"Press play and watch absolutely nothing happen. Very on brand for this machine."'}</p>
      </div>

      <div className="mixer-controls">
        <button type="button" onClick={() => { setPlaying(false); setIndex((value) => (value + 1) % TRACKS.length) }} aria-label="Next track"><SkipForward size={15} /></button>
        <button type="button" className="mixer-play" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Square size={15} /> : <Play size={15} />}</button>
        <button type="button" onClick={() => setPlaying(false)} aria-label="Stop"><PhoneOff size={15} /></button>
      </div>

      <div className="mixer-tracks">
        {TRACKS.map((item, position) => (
          <button type="button" key={item.title} className={cn('mixer-track', position === index && 'mixer-track-active')} onClick={() => setIndex(position)}>
            <span>{String(position + 1).padStart(2, '0')}</span>
            <strong>{item.title}</strong>
            <em>{item.length}</em>
            <small>{item.note}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

interface DialerProps {
  mood: TsunMood
  onOpenChat: () => void
  interactions: number
}

/** A dialer that only ever reaches one person, and she would prefer that you text. */
export function DialerApp({ mood, onOpenChat, interactions }: DialerProps) {
  const [number, setNumber] = useState('')
  const [line, setLine] = useState('DIAL 1 FOR TSUN. SHE WILL NOT PICK UP BEFORE THE THIRD RING.')
  const calls = useMemo(() => [
    { who: 'YOUR BROKER', when: 'MISSED 09:14', note: 'Three times. He sounded nervous.' },
    { who: 'MANAGING DIRECTOR', when: 'DECLINED 11:02', note: 'You do not work here anymore, sir.' },
    { who: 'DESK 04', when: 'HOLD 45 MIN', note: 'They asked about latency. Rude.' },
  ], [])

  const press = (key: string) => {
    setNumber((current) => (current + key).slice(0, 12))
    if (number.length >= 11) return
    if (key === '1') setLine(`RINGING. RING ${Math.min(3, number.length + 1)} OF 3. SHE IS DECIDING WHETHER YOU ARE WORTH THE CALL.`)
    else if (key === '5') setLine('HELP DESK DEPARTMENT OF ONE. THAT ONE IS BUSY BEING DISAPPOINTED.')
    else if (key === '#') setLine('THAT IS NOT A NUMBER. THAT IS A CRY FOR ATTENTION.')
  }

  return (
    <div className="dialer app-scroll">
      <header className="dialer-head">
        <div><span className="eyebrow">TSUN//TELEPHONY</span><h1>Phone Dialer</h1></div>
        <span className="dialer-mood">LINE MOOD {mood} / {interactions} LOGGED</span>
      </header>

      <div className="dialer-body">
        <section className="dialer-pad">
          <div className="dialer-screen" aria-live="polite">
            <strong>{number || 'EXTENSION 1'}</strong>
            <span>{line}</span>
          </div>
          <div className="dialer-grid">
            {KEYS.map((key) => <button type="button" key={key} onClick={() => press(key)}>{key}</button>)}
          </div>
          <div className="dialer-actions">
            <button type="button" className="dialer-cta" onClick={() => { setNumber('1'); setLine('CONNECTING. SHE WILL MAKE IT FEEL LIKE AN INCONVENIENCE.'); onOpenChat() }}><Phone size={15} /> DIAL 1 FOR TSUN</button>
            <button type="button" onClick={() => { setNumber(''); setLine('LINE CLEARED. THAT WAS PROBABLY WISE.') }}>CLEAR</button>
          </div>
        </section>

        <section className="dialer-log">
          <span className="eyebrow">CALL LOG, ALL FICTIONAL</span>
          {calls.map((call) => (
            <article key={call.who}>
              <strong>{call.who}</strong>
              <em>{call.when}</em>
              <p>{call.note}</p>
            </article>
          ))}
          <p className="dialer-footnote">No call is placed. No number is stored. This is a pretend phone on a pretend desk.</p>
        </section>
      </div>
    </div>
  )
}
