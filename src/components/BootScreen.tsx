import { useEffect, useState } from 'react'
import type { DataStatus, RelationshipLevel, TsunMood } from '../types'

interface BootScreenProps {
  mood: TsunMood
  relationship: RelationshipLevel
  marketStatus: DataStatus
  returning: boolean
  onComplete: () => void
}

export function BootScreen({ mood, relationship, marketStatus, returning, onComplete }: BootScreenProps) {
  const [step, setStep] = useState(0)
  const lines = [
    ['TSUN SYSTEMS BIOS v2.04', 'SHIBUYA FLOOR 4', ''],
    ['COPYRIGHT 2024-2026 TSUN SYSTEMS', '', ''],
    ['CPU', '80486DX2 / TSUN CORE @ 66MHz', 'OK'],
    ['RAM', '8192K (640K is for retail)', 'OK'],
    ['KEYBOARD', '104 keys (3 stuck from coffee)', 'OK'],
    ['MOUSE', 'detected (gold-plated, obviously)', 'OK'],
    ['ATTITUDE', 'coprocessor present but unlicensed', 'OK'],
    ['MEMORY', `USER CONTEXT ${relationship}`, 'OK'],
    ['NETWORK', 'UPLINK / X FEED', 'OK'],
    ['SOLANA', 'RPC', marketStatus === 'live' ? 'OK' : marketStatus === 'unavailable' ? 'UNAVAILABLE' : 'CHECKING'],
    ['MARKET', 'DATA LINK', marketStatus === 'live' ? 'OK' : marketStatus === 'unavailable' ? 'UNAVAILABLE' : 'CHECKING'],
    ['PORTFOLIO', 'SIMULATED LEDGER', 'SIMULATED'],
    ['MOOD', mood, 'LOADED'],
    ['PNL', '-14.2% (market is wrong)', 'OK'],
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
    const skip = (event: KeyboardEvent) => {
      if (['Enter', 'Escape', ' '].includes(event.key)) {
        event.preventDefault()
        onComplete()
      }
    }
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
  }, [onComplete])

  return (
    <main className="boot-screen" aria-label="TSUN operating system boot sequence">
      <div className="boot-noise" />
      <div className="boot-content">
        <div className="boot-topline">
          <span>TSUN SYSTEMS BIOS v2.04 — SHIBUYA, TRADING FLOOR 4</span>
          <span>{returning ? 'RESUME SESSION' : 'INITIALIZE SESSION'}</span>
        </div>
        <div className="boot-rule" />
        <p className="boot-sub">TSUN OPERATOR TERMINAL, EST. 2024 — SHAREHOLDER SERVICES: DENIED</p>
        {returning && <p className="boot-welcome">WELCOME BACK. RESTORING YOUR LAST LOCAL CONTEXT. PRESS ANY KEY TO SKIP.</p>}
        <div className="boot-lines">
          {lines.slice(0, step).map(([label, value, state], index) => (
            <div className="boot-line" key={`${label}-${index}`}>
              <span>{label.padEnd(12, '.')}</span>
              <span>{value.padEnd(19, '.')}</span>
              <span className={state === 'UNAVAILABLE' ? 'boot-state-warn' : ''}>{state}</span>
            </div>
          ))}
          {step > lines.length && <div className="boot-awake">TSUN IS AWAKE.<br />Why are you here?</div>}
        </div>
        <div className="boot-footer">
          <span>NO CUSTODY. NO FABRICATED MARKETS. MVP MODE. — PRESS ANY KEY TO SKIP</span>
          <button type="button" className="boot-skip" onClick={onComplete}>SKIP BOOT [PRESS ANY KEY]</button>
        </div>
      </div>
    </main>
  )
}
