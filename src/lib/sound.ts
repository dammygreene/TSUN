let ctx: AudioContext | null = null

function getCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch { return null }
  }
  return ctx
}

export function playClick(muted: boolean) {
  if (muted) return
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'
  osc.frequency.value = 800
  gain.gain.value = 0.08
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
  osc.stop(c.currentTime + 0.08)
}

export function playDialTone(muted: boolean, digit: string) {
  if (muted) return
  const c = getCtx()
  if (!c) return
  const freqMap: Record<string, number> = { '1': 697, '2': 770, '3': 852, '4': 770, '5': 852, '6': 941, '7': 852, '8': 941, '9': 941, '0': 941, '*': 941, '#': 941 }
  const f = freqMap[digit] || 770
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.frequency.value = f
  gain.gain.value = 0.12
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
  osc.stop(c.currentTime + 0.15)
}

export function playBoot(muted: boolean) {
  if (muted) return
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.frequency.value = 440
  gain.gain.value = 0.15
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.3)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4)
  osc.stop(c.currentTime + 0.4)
}
