import { useState } from 'react'
import { Car, Phone, Music, Mail, Gamepad2, Recycle, Trash2, Play, Pause, Square, Delete, PhoneCall, Printer, Info, HelpCircle } from 'lucide-react'

export function MediaPlayerApp({ onToast }: { onToast: (title: string, body: string) => void }) {
  const [playing, setPlaying] = useState(false)
  const [track, setTrack] = useState(0)
  const tracks = [
    { file: 'TSUN_MIX_98.MP3', label: 'WAITING FOR THE OPENING BELL...', dur: '03:42' },
    { file: 'CHART_STARE.MP3', label: 'MARKET IS WRONG (LOOP)', dur: '02:18' },
    { file: 'ATTITUDE.EXE.MP3', label: 'ATTITUDE MISMATCH ANTHEM', dur: '04:05' },
    { file: 'HUMILITY_NOT_FOUND.MP3', label: 'FILE CORRUPTED', dur: '00:03' },
  ]
  const t = tracks[track]
  return (
    <div className="fun-app media-app app-scroll">
      <div className="app-page-header">
        <div><span className="eyebrow">AUDIO DESK — TSUN 98</span><h1><Music size={18} /> Media Player</h1><p>Now Playing widget expanded. No actual audio device. There is no soundtrack. Focus.</p></div>
        <span className="mode-badge"><i /> TAPE DECK</span>
      </div>
      <div className="media-player-large">
        <div className="media-screen">
          <strong>{t.file}</strong>
          <span>{t.label}</span>
          <em>{t.dur}</em>
          <div className="media-visual-large">
            <i /><i /><i /><i /><i /><i /><i />
          </div>
        </div>
        <div className="media-controls-large">
          <button type="button" onClick={() => { setPlaying(!playing); onToast(playing ? 'PAUSED' : 'PLAYING', `${t.file} ${playing ? 'paused' : 'playing'}`) }}>{playing ? <Pause size={16}/> : <Play size={16}/>} {playing ? 'PAUSE' : 'PLAY'}</button>
          <button type="button" onClick={() => { setPlaying(false); onToast('STOPPED', 'Audio device not connected') }}><Square size={14}/> STOP</button>
          <button type="button" onClick={() => setTrack((track+1)%tracks.length)}>NEXT TAPE</button>
        </div>
        <div className="media-playlist">
          {tracks.map((tr, i) => <button key={tr.file} className={i===track ? 'active' : ''} onClick={() => setTrack(i)}><span>{tr.file}</span><small>{tr.label}</small></button>)}
        </div>
      </div>
      <div className="fun-note">Inspired by Stratton's Now Playing widget. TSUN's version is more annoyed and has fewer gold-plated accessories.</div>
    </div>
  )
}

export function PhoneDialerApp({ onToast }: { onToast: (title: string, body: string) => void }) {
  const [number, setNumber] = useState('')
  const [dialing, setDialing] = useState(false)
  const dial = () => {
    if (!number) { onToast('DIALER', 'Enter a number. TSUN: We are not here to make friends.'); return }
    setDialing(true)
    onToast('COLD CALL', `Dialing ${number}... Prospect: "Who is this?" TSUN: "Someone who verifies before claiming conviction."`)
    setTimeout(() => setDialing(false), 2000)
  }
  return (
    <div className="fun-app dialer-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">SALES FLOOR — PHONE DESK</span><h1><Phone size={18}/> Phone Dialer</h1><p>Cold Call Trainer v7. Script: "Do you have a moment to talk about your risk management?"</p></div><span className="mode-badge muted">12 BROKERS</span></div>
      <div className="dialer-body">
        <div className="dialer-display"><span>{number || 'ENTER NUMBER'}</span><em>{dialing ? 'DIALING...' : 'READY'}</em></div>
        <div className="dialer-pad">
          {['1','2','3','4','5','6','7','8','9','*','0','#'].map(k => <button key={k} onClick={() => setNumber(n => (n+k).slice(0,16))}>{k}</button>)}
          <button onClick={() => setNumber('')}><Delete size={14}/> CLR</button>
          <button className="dial-action" onClick={dial}><PhoneCall size={16}/> DIAL</button>
        </div>
        <div className="dialer-scripts">
          <strong>SALES SCRIPTS</strong>
          <p>"This is TSUN from TSUN Systems. I am not selling you anything. I am telling you your data is unverified."</p>
          <p>"Pop quiz. What is the only valid price? A verified price."</p>
        </div>
      </div>
    </div>
  )
}

export function FerrariApp({ onToast }: { onToast: (title: string, body: string) => void }) {
  return (
    <div className="fun-app ferrari-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">SHORTCUT — CORRUPTED</span><h1><Car size={18}/> Ferrari.lnk</h1><p>Shortcut target not found. TSUN: You cannot afford the gas. Stick to SOL.</p></div><span className="mode-badge muted">LNK ERROR</span></div>
      <div className="ferrari-body">
        <div className="ferrari-placeholder">
          <Car size={48} />
          <span>FERRARI TESTAROSSA — IMAGE NOT FOUND</span>
          <small>File: C:\TSUN_OS\FERRARI\TESTAROSSA.JPG — corrupted (gold-plated, why)</small>
        </div>
        <div className="ferrari-stats">
          <div><span>0-60</span><strong>UNAVAILABLE</strong></div>
          <div><span>TOP SPEED</span><strong>MARKET IS WRONG</strong></div>
          <div><span>PRICE</span><strong>VERIFY FIRST</strong></div>
        </div>
        <button type="button" className="system-button ghost" onClick={() => onToast('FERRARI.LNK', 'Shortcut corrupted. TSUN: Stick to SOL, not supercars.')}>TRY AGAIN</button>
      </div>
    </div>
  )
}

export function MailApp() {
  const mails = [
    { from: 'wallstreet@tsun.systems', subject: 'RE: Attitude Mismatch Hearing', date: '2024-09-18', body: 'TSUN, your attitude coprocessor is unlicensed. Please report to HR. — Management' },
    { from: 'degen@solana.xyz', subject: 'wen TSUN token?', date: '2026-09-20', body: 'Hey TSUN, what is the price of TSUN? — A. Trader (TSUN: Configure VITE_TSUN_TOKEN_ADDRESS, I am not inventing it)' },
    { from: 'naomi@stratton.fan', subject: '❤', date: '1989-06-12', body: 'This is a parody reference to Stratton.capital Naomi folder. TSUN: Not that kind of workstation.' },
    { from: 'risk@desk.internal', subject: 'Risk Management FINAL.pdf corrupted', date: '2026-09-19', body: 'File says "Risk management is just fear with a spreadsheet." Please advise. — TSUN: This statement is satire.' },
  ]
  return (
    <div className="fun-app mail-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">INBOX — 4 UNREAD (ALL ANNOYING)</span><h1><Mail size={18}/> Mail</h1><p>Wall Street inbox, TSUN style. No custody, no fabricated markets.</p></div><span className="mode-badge">TSUN 98 MAIL</span></div>
      <div className="mail-list">
        {mails.map(m => <article key={m.subject} className="mail-item"><div className="mail-head"><strong>{m.from}</strong><span>{m.date}</span></div><h3>{m.subject}</h3><p>{m.body}</p></article>)}
      </div>
    </div>
  )
}

export function GameApp({ quota, onMotivate, onDrill, onLunch, mood }: { quota: number; onMotivate: () => void; onDrill: () => void; onLunch: () => void; mood: string }) {
  return (
    <div className="fun-app game-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">BOILER ROOM TYCOON — TSUN EDITION</span><h1><Gamepad2 size={18}/> Trading Floor</h1><p>Make calls, close deals, verify data. Daily quota $0 / $250k. Inspired by Stratton's floor monitor.</p></div><span className="mode-badge">FLOOR 4</span></div>
      <div className="game-stats">
        <div><span>QUOTA</span><strong>${quota.toLocaleString()} / $250,000</strong><em>{quota >= 250000 ? 'QUOTA HIT — TSUN IS SMUG' : 'KEEP DIALING'}</em></div>
        <div><span>MOOD</span><strong>{mood}</strong></div>
        <div><span>BROKERS</span><strong>12 brokers — {quota > 0 ? '3 on lines' : '0 on lines'}</strong></div>
      </div>
      <div className="game-actions">
        <button onClick={onMotivate}>📣 Motivate Floor (+$15k)</button>
        <button onClick={onDrill}>👮 Drill Floor (Pop Quiz)</button>
        <button onClick={onLunch}>🍕 Lunch (Reset Morale)</button>
      </div>
      <div className="game-brokers">
        <div className="broker-head"><span>NAME</span><span>STATUS</span><span>CALLS</span><span>GROSS</span></div>
        {[
          { name: 'Stevie 2-Phones', status: 'On line', calls: 142, gross: '$12k' },
          { name: 'Sal "Moose"', status: 'Dialing', calls: 98, gross: '$8k' },
          { name: 'TSUN (AI)', status: 'Judging', calls: 0, gross: 'VERIFY FIRST' },
          { name: 'Retail Rick', status: 'Asking wen', calls: 12, gross: '$0' },
        ].map(b => <div key={b.name} className="broker-row"><span>{b.name}</span><span>{b.status}</span><span>{b.calls}</span><span>{b.gross}</span></div>)}
      </div>
      <div className="fun-note">Parody game. No actual boiler room. Just attitude. Like stratton.capital but with more verification and fewer felonies.</div>
    </div>
  )
}

export function RecycleApp({ onToast }: { onToast: (title: string, body: string) => void }) {
  const files = [
    { name: 'HUMILITY.exe', size: '0 KB', note: 'FILE CORRUPTED — HAS NEVER EXISTED' },
    { name: 'apology_naomi_v7.txt', size: '2 KB', note: 'Parody ref — TSUN version is apology_degen_v7.txt' },
    { name: 'the_duchess.jpg', size: '1.2 MB', note: 'Image not found — TSUN has no duchess, only PnL' },
    { name: 'Ferrari.lnk', size: '1 KB', note: 'Shortcut corrupted' },
    { name: 'risk_management_FINAL_FINAL.pdf', size: '0 KB', note: 'Risk is fear with a spreadsheet (satire)' },
  ]
  return (
    <div className="fun-app recycle-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">RECYCLE BIN — 5 ITEMS</span><h1><Recycle size={18}/> Recycle Bin</h1><p>Deleted files TSUN forgot to delete. Like Stratton's bin, but with more attitude mismatches.</p></div><span className="mode-badge muted">BIN</span></div>
      <div className="recycle-list">
        {files.map(f => <div key={f.name} className="recycle-item"><Trash2 size={16}/><div><strong>{f.name}</strong><span>{f.size} — {f.note}</span></div><button onClick={() => onToast('RECYCLE BIN', `${f.name}: Cannot restore. TSUN: Some files should stay deleted.`)}>RESTORE</button></div>)}
      </div>
    </div>
  )
}

export function FaxApp({ onToast }: { onToast: (title: string, body: string) => void }) {
  const [sending, setSending] = useState(false)
  const [page, setPage] = useState('MARKET IS WRONG — VERIFY FIRST')
  const send = () => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      onToast('FAX MACHINE', `Fax sent to 1989: "${page}". Response: "We are busy. The tape is moving."`)
    }, 1500)
  }
  return (
    <div className="fun-app fax-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">FAX MACHINE — DIALING 1989</span><h1><Printer size={18}/> Fax Machine</h1><p>Send a fax to the past. Like Stratton's fax, but with more verification.</p></div><span className="mode-badge">FAX</span></div>
      <div className="fax-body">
        <div className="fax-paper">
          <span>TO: WALL STREET, 1989</span>
          <span>FROM: TSUN 98, SHIBUYA FLOOR 4</span>
          <textarea value={page} onChange={e=>setPage(e.target.value)} rows={6} />
          <em>STATUS: {sending ? 'SENDING...' : 'READY'}</em>
        </div>
        <button className="system-button primary" onClick={send} disabled={sending}>{sending ? 'SENDING...' : 'SEND FAX'}</button>
        <div className="fun-note">Fax machine is parody. No actual fax. Just attitude and thermal paper.</div>
      </div>
    </div>
  )
}

export function AboutApp() {
  return (
    <div className="fun-app about-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">TSUN 98 — SYSTEM PROPERTIES</span><h1><Info size={18}/> About TSUN 98</h1><p>TSUN//OS is a parody workstation. Inspired by stratton.capital vibe, built with TSUN attitude.</p></div><span className="mode-badge">TSUN 98</span></div>
      <div className="about-body">
        <div className="about-logo">TSUN//OS 98</div>
        <div className="about-specs">
          <div><span>VERSION</span><strong>2.04 — SHIBUYA FLOOR 4</strong></div>
          <div><span>BIOS</span><strong>TSUN SYSTEMS BIOS v2.04</strong></div>
          <div><span>CPU</span><strong>80486DX2 / TSUN CORE @ 66MHz</strong></div>
          <div><span>RAM</span><strong>8192K (640K is for retail)</strong></div>
          <div><span>MOUSE</span><strong>Gold-plated, why, who approved this</strong></div>
          <div><span>ATTITUDE</span><strong>Coprocessor present but unlicensed</strong></div>
        </div>
        <div className="about-disclaimer">
          <strong>A note about all this</strong>
          <p>Parody fan project. TSUN is a fictional 24-year-old adult AI. Token TSUN on Solana, pair TSUN/SOL. Portfolio is SIMULATED MVP. Token data stays unconfigured unless VITE_TSUN_TOKEN_ADDRESS is set. Only SOL and BTC are verified (CoinGecko). Every figure here is invented until a real source is configured. Not financial advice. Inspired by stratton.capital's Win95/98 OS parody, but with TSUN's rude/hostile 40%, financial arrogance 25%, bitter ex-Wall-Street 15%, impatient superiority 10%, Crypto X brainrot 5%, accidental affection 5%.</p>
          <p>TSUN lies about interpretation, never about facts. No invented numbers. No profit promises. Never asks for keys.</p>
        </div>
        <div className="about-credits">
          <span>BUILT WITH</span>
          <strong>React + Vite + TSUN attitude + Stratton 95 vibe</strong>
        </div>
      </div>
    </div>
  )
}

export function HowItWorksApp({ onOpen }: { onOpen: (id: any) => void }) {
  return (
    <div className="fun-app how-app app-scroll">
      <div className="app-page-header"><div><span className="eyebrow">SETUP — TSUN 98</span><h1><HelpCircle size={18}/> How It Works</h1><p>Setup guide for TSUN 98. Like Stratton's How It Works Setup, but with more verification.</p></div><span className="mode-badge">SETUP</span></div>
      <div className="how-steps">
        <div className="how-step"><span>01</span><div><strong>VERIFY DATA FIRST</strong><p>Only provider response becomes a number. Everything else is explicitly unavailable. No stale data displayed as live.</p></div></div>
        <div className="how-step"><span>02</span><div><strong>TALK TO TSUN</strong><p>Chat uses OpenRouter primary (Claude Sonnet 4.5) + Gemini fallback. Verified facts from market/token/wallet are injected. TSUN is rude but truthful.</p><button className="system-button ghost" onClick={()=>onOpen('chat')}>OPEN CHAT</button></div></div>
        <div className="how-step"><span>03</span><div><strong>TRADING FLOOR</strong><p>Motivate / Drill / Lunch buttons in monitor + Boiler Room Tycoon game. Daily quota $0 / $250k. 12 brokers 0 on lines. Make calls, close deals, verify data.</p><button className="system-button ghost" onClick={()=>onOpen('game')}>OPEN TYCOON</button></div></div>
        <div className="how-step"><span>04</span><div><strong>MEDIA & FAX</strong><p>Now Playing tape deck TSUN_MIX_98.MP3, Phone Dialer cold call trainer, Fax to 1989, Ferrari.lnk corrupted shortcut. All parody, all fun.</p></div></div>
        <div className="how-step"><span>05</span><div><strong>NO CUSTODY, NO FABRICATION</strong><p>Wallet inspection is public read only. Never paste seed phrases. Portfolio is SIMULATED MVP. This is a fan project.</p></div></div>
      </div>
    </div>
  )
}
