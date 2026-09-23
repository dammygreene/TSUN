import type { TsunMood } from '../types'
import { cn } from '../lib/format'

interface AvatarProps {
  mood: TsunMood
  compact?: boolean
  imagePath?: string
}

const moodLabel: Record<TsunMood, string> = {
  NORMAL: 'MONITORING THE TERMINAL',
  ANNOYED: 'TOLERATING THE TIMELINE',
  ANGRY: 'RUNNING OUT OF PATIENCE',
  FURIOUS: 'SYSTEM TEMPERATURE ELEVATED',
  SMUG: 'MARKET TASTE DETECTED',
  EMBARRASSED: 'NO COMMENT ON PNL',
  FLUSTERED: 'EMOTIONAL FIREWALL BUSY',
  HAPPY: 'RELUCTANTLY PLEASED',
  PANICKING: 'RECALCULATING EVERYTHING',
  DERE: 'KEEPING THE LIGHT ON',
}

export function Avatar({ mood, compact = false, imagePath = '/tsun_portrait.jpe' }: AvatarProps) {
  const eyeMood = mood === 'ANGRY' || mood === 'FURIOUS' ? 'angry' : mood === 'SMUG' ? 'smug' : mood === 'EMBARRASSED' || mood === 'FLUSTERED' ? 'soft' : 'normal'

  return (
    <div className={cn('avatar-shell', `avatar-${mood.toLowerCase()}`, compact && 'avatar-compact')} aria-label={`TSUN visual state: ${mood}`}>
      <div className="avatar-orbit orbit-one" />
          <img className="avatar-image" src={imagePath} alt={`TSUN avatar for mood: ${mood}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/tsun_portrait.jpe' }} />
      <div className="avatar-orbit orbit-two" />
      <svg className="avatar-art" viewBox="0 0 280 340" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="hair" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f0ebe7" />
            <stop offset="65%" stopColor="#a89fa4" />
            <stop offset="100%" stopColor="#706b72" />
          </linearGradient>
          <linearGradient id="coat" x1="0" x2="1">
            <stop offset="0%" stopColor="#282529" />
            <stop offset="100%" stopColor="#131313" />
          </linearGradient>
        </defs>
        <path d="M31 305c10-65 42-93 84-102h51c47 9 75 38 84 102H31Z" fill="url(#coat)" stroke="#4c464c" strokeWidth="1.5" />
        <path d="M94 212l46 56 47-56 27 93H66l28-93Z" fill="#0c0b0c" stroke="#484047" strokeWidth="1.2" />
        <path d="M92 161c0 53 20 79 48 79s48-26 48-79V91H92v70Z" fill="#e6ddd9" stroke="#83777a" strokeWidth="1.5" />
        <path d="M83 116c2-68 31-101 64-101 43 0 71 37 61 104-14-22-37-43-69-49-18 26-37 39-56 46Z" fill="url(#hair)" stroke="#797177" strokeWidth="2" />
        <path d="M80 123c-5 47 1 83 21 106-15-38-13-74 1-113-9 4-15 6-22 7Z" fill="#c4bbc1" stroke="#797177" strokeWidth="1.3" />
        <path d="M201 119c6 47 1 85-18 107 11-39 8-76-7-112 9 4 17 6 25 5Z" fill="#b7afb6" stroke="#797177" strokeWidth="1.3" />
        <path d="M83 92c5-40 31-71 65-75-13 17-20 37-20 58-16 2-31 8-45 17Z" fill="#efe8eb" opacity=".8" />
        <path d="M112 152c7-5 16-5 23 0" fill="none" stroke="#53474d" strokeWidth={eyeMood === 'angry' ? '2.5' : '1.5'} strokeLinecap="round" transform={eyeMood === 'angry' ? 'rotate(-8 123 152)' : undefined} />
        <path d="M151 152c7-5 16-5 23 0" fill="none" stroke="#53474d" strokeWidth={eyeMood === 'angry' ? '2.5' : '1.5'} strokeLinecap="round" transform={eyeMood === 'angry' ? 'rotate(8 162 152)' : undefined} />
        <ellipse cx="124" cy="157" rx={eyeMood === 'soft' ? '2.5' : '3.5'} ry="5" fill="#df7387" />
        <ellipse cx="162" cy="157" rx={eyeMood === 'soft' ? '2.5' : '3.5'} ry="5" fill="#df7387" />
        {mood === 'SMUG' ? (
          <path d="M130 190c8 6 19 7 29 0" fill="none" stroke="#9f5366" strokeWidth="2" strokeLinecap="round" />
        ) : mood === 'ANGRY' || mood === 'FURIOUS' ? (
          <path d="M132 192h20" stroke="#9f5366" strokeWidth="2" strokeLinecap="round" />
        ) : mood === 'EMBARRASSED' || mood === 'FLUSTERED' ? (
          <path d="M134 192c5-2 10-2 15 0" fill="none" stroke="#9f5366" strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <path d="M132 192c6 3 13 3 20 0" fill="none" stroke="#9f5366" strokeWidth="1.8" strokeLinecap="round" />
        )}
        {(mood === 'EMBARRASSED' || mood === 'FLUSTERED' || mood === 'DERE') && <><path d="M101 178l16 4" stroke="#dc8a96" opacity=".45" /><path d="M163 182l16-4" stroke="#dc8a96" opacity=".45" /></>}
        <path d="M116 240h47l-23 28-24-28Z" fill="#df7387" opacity=".7" />
        <path d="M122 268h36l-18 31-18-31Z" fill="#df7387" opacity=".34" />
      </svg>
      {!compact && (
        <div className="avatar-copy">
          <span className="eyebrow">TSUN // VISUAL CORE</span>
          <strong>{mood}</strong>
          <span>{moodLabel[mood]}</span>
        </div>
      )}
    </div>
  )
}
