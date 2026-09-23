import { useEffect } from 'react'

interface ShutdownScreenProps {
  onRestart: () => void
}

export function ShutdownScreen({ onRestart }: ShutdownScreenProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['Enter', 'Escape', ' '].includes(e.key)) onRestart()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onRestart])

  return (
    <main className="shutdown-screen" onClick={onRestart} role="button" tabIndex={0} aria-label="Shutdown screen, click to restart">
      <div className="shutdown-content">
        <div className="shutdown-logo">TSUN//OS</div>
        <h1>It's now safe to turn off your computer.</h1>
        <p>The show goes on — click to restart.</p>
        <span>TSUN SYSTEMS BIOS v2.04 — SHIBUYA FLOOR 4</span>
        <em>NO CUSTODY. NO FABRICATED MARKETS. PARODY FAN PROJECT.</em>
      </div>
    </main>
  )
}
