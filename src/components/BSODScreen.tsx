import { useEffect } from 'react'

export function BSODScreen({ onRestart }: { onRestart: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (['Enter','Escape',' '].includes(e.key)) onRestart() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onRestart])
  return (
    <main className="bsod-screen" onClick={onRestart} role="button" tabIndex={0} aria-label="Blue screen, click to restart">
      <div className="bsod-content">
        <span>TSUN//OS</span>
        <h1>An error has occurred. To continue:</h1>
        <p>Press Enter to return to TSUN 98, or press Ctrl+Alt+Del to restart your computer. If you do this, you will lose any unsaved information in all open applications.</p>
        <p>Error: 0E : 016F : BFF9B3D4 — ATTITUDE_MISMATCH</p>
        <p>TSUN: The market is wrong. Not me. Press any key to continue _</p>
      </div>
    </main>
  )
}
