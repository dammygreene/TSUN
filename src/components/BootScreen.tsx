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
    ['MEMORY', 'USER CONTEXT', 'OK'],
    ['NETWORK', 'UPLINK', 'OK'],
    ['SOLANA', 'RPC', 'CHECKING'],
    ['MARKET', 'DATA LINK', marketStatus === 'live' ? 'OK' : marketStatus === 'unavailable' ? 'UNAVAILABLE' : 'CHECKING'],
    ['PORTFOLIO', 'CONNECTION', 'SIMULATED'],
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
          <span>TSUN SYSTEMS BIOS v2.04</span>
          <span>{returning ? 'RESUME SESSION' : 'INITIALIZE SESSION'}</span>
        </div>
        <div className="boot-rule" />
        {returning && <p className="boot-welcome">WELCOME BACK. RESTORING YOUR LAST LOCAL CONTEXT.</p>}
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
          <span>NO CUSTODY. NO FABRICATED MARKETS. MVP MODE.</span>
          <button type="button" className="boot-skip" onClick={onComplete}>SKIP BOOT</button>
        </div>
      </div>
    </main>
  )
}
