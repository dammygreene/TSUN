/**
 * Tiny WebAudio blips for the workstation shell. No audio files, no autoplay, no noise.
 * The output is short, dry and deliberately a little cheap, like a motherboard speaker.
 */

type SoundName = 'click' | 'open' | 'close' | 'alert' | 'blip'

let context: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!context) context = new Ctor()
  return context
}

/** Kept separate so a user gesture can unlock audio before the first blip is heard. */
export function primeSound() {
  const ctx = audio()
  if (ctx && ctx.state === 'suspended') void ctx.resume()
}

export function playSound(name: SoundName) {
  const ctx = audio()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const start = ctx.currentTime
  const tone = (frequency: number, offset: number, duration: number, gain: number, type: OscillatorType = 'square') => {
    const oscillator = ctx.createOscillator()
    const amp = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start + offset)
    amp.gain.setValueAtTime(0.0001, start + offset)
    amp.gain.exponentialRampToValueAtTime(gain, start + offset + 0.008)
    amp.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration)
    oscillator.connect(amp).connect(ctx.destination)
    oscillator.start(start + offset)
    oscillator.stop(start + offset + duration + 0.02)
  }

  switch (name) {
    case 'click':
      tone(1180, 0, 0.03, 0.02)
      break
    case 'blip':
      tone(760, 0, 0.05, 0.018, 'triangle')
      break
    case 'open':
      tone(520, 0, 0.05, 0.02, 'triangle')
      tone(780, 0.05, 0.07, 0.016, 'triangle')
      break
    case 'close':
      tone(620, 0, 0.05, 0.018, 'triangle')
      tone(360, 0.05, 0.07, 0.014, 'triangle')
      break
    case 'alert':
      tone(240, 0, 0.14, 0.026)
      tone(190, 0.16, 0.16, 0.022)
      break
  }
}
