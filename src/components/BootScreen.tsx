import { useEffect, useState } from 'react'
import type { DataStatus, RelationshipLevel, TsunMood } from '../types'
import { cn } from '../lib/format'

interface BootScreenProps {
  mood: TsunMood
  relationship: RelationshipLevel
  marketStatus: DataStatus
  returning: boolean
  onComplete: () => void
  modelLine: string
}

const HARDWARE = [
  ['TSUN SYSTEMS BIOS v2.04', 'Copyright (C) 1994, 2026 TSUN Systems, Off Wall Street'],
  ['Main Processor', 'TSUN CORE 80486DX2 / 66 MHz'],
  ['Memory Test', '8192K OK, 640K CONVENTIONAL'],
  ['Fixed Disk 0', 'CONNER CP30254 (245 MB), 4.2 MB FREE'],
]

export function BootScreen({ mood, relationship, marketStatus, returning, onComplete, modelLine }: BootScreenProps) {
  const [step, setStep] = useState(0)
  const lines = [
    ['MEMORY', 'USER CONTEXT', 'OK'],
    ['NETWORK', 'MODEL LINK', modelLine],
    ['SOLANA', 'RPC', 'CHECKING'],
    ['MARKET', 'DATA LINK', marketStatus === 'live' ? 'OK' : marketStatus === 'unavailable' ? 'UNAVAILABLE' : 'CHECKING'],
    ['PORTFOLIO', 'CONNECTION', 'SIMULATED'],
    ['DESK', 'FLOOR CAM 01', 'FICTIONAL'],
    ['MOOD', mood, 'LOADED'],
    ['RELATIONSHIP', relationship, 'LOADED'],
  ] as const

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= lines.length + 1) {
          window.clearInterval(timer)
          window.setTimeout(onComplete, returning ? 260 : 550)
          return current
        }
        return current + 1
      })
    }, returning ? 95 : 230)
    return () => window.clearInterval(timer)
  }, [lines.length, onComplete, returning])

  useEffect(() => {
    const skip = () => {
      window.removeEventListener('keydown', skip)
      onComplete()
    }
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
  }, [onComplete])

  return (
    <main className="boot-screen" aria-label="TSUN operating system boot sequence">
      <div className="boot-noise" />
      <div className="boot-content">
        <div className="boot-topline">
          <span>{HARDWARE[0][0]}</span>
          <span>{returning ? 'RESUME SESSION' : 'INITIALIZE SESSION'}</span>
        </div>
        <p className="boot-copyright">{HARDWARE[0][1]}</p>
        <div className="boot-rule" />
        <dl className="boot-hardware">
          {HARDWARE.slice(1).map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
        <div className="boot-rule" />
        {returning && <p className="boot-welcome">WELCOME BACK. RESTORING YOUR LAST LOCAL CONTEXT.</p>}
        <div className="boot-lines">
          {lines.slice(0, step).map(([label, value, state], index) => (
            <div className="boot-line" key={`${label}-${index}`}>
              <span>{label.padEnd(12, '.')}</span>
              <span>{value.padEnd(19, '.')}</span>
              <span className={cn(state === 'UNAVAILABLE' && 'boot-state-warn', state === 'FICTIONAL' && 'boot-state-fictional')}>{state}</span>
            </div>
          ))}
          {step > lines.length && <div className="boot-awake">TSUN IS AWAKE.<br />Why are you here?</div>}
        </div>
        <div className="boot-footer">
          <span>NO CUSTODY. NO FABRICATED MARKETS. ONE HONEST DESK.</span>
          <button type="button" className="boot-skip" onClick={onComplete}>PRESS ANY KEY TO SKIP</button>
        </div>
      </div>
    </main>
  )
}

/** The half-ironic shutdown state. It is a bit, but it also honestly says the session is local. */
export function ShutdownScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <main className="shutdown-screen" onClick={onRestart} role="button" tabIndex={0} onKeyDown={onRestart} aria-label="Restart the TSUN workstation">
      <div className="shutdown-text">
        <p>It is now safe to turn off</p>
        <p>your computer.</p>
        <small>Local session only. TSUN is asleep, not gone.</small>
        <em>(the show goes on, click to restart)</em>
      </div>
    </main>
  )
}
