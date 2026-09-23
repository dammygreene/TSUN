import { Pause, Play, Square } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/format'

interface NowPlayingProps {
  onToast: (title: string, body: string) => void
}

export function NowPlaying({ onToast }: NowPlayingProps) {
  const [playing, setPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(0)

  const tracks = [
    { file: 'TSUN_MIX_98.MP3', label: 'WAITING FOR THE OPENING BELL...', duration: '03:42' },
    { file: 'CHART_STARE.MP3', label: 'MARKET IS WRONG (LOOP)', duration: '02:18' },
    { file: 'ATTITUDE.EXE.MP3', label: 'ATTITUDE MISMATCH ANTHEM', duration: '04:05' },
    { file: 'HUMILITY_NOT_FOUND.MP3', label: 'FILE CORRUPTED', duration: '00:03' },
  ]

  const track = tracks[trackIndex]

  const toggle = () => {
    const next = !playing
    setPlaying(next)
    onToast(next ? 'TSUN AUDIO DESK' : 'TSUN AUDIO PAUSED', next ? `${track.file} is playing. There is no soundtrack. Focus.` : 'Audio paused. The market is still wrong.')
  }

  const stop = () => {
    setPlaying(false)
    onToast('TSUN AUDIO STOPPED', 'Audio device: not connected. TSUN: There is no soundtrack. Focus.')
  }

  const nextTrack = () => {
    const next = (trackIndex + 1) % tracks.length
    setTrackIndex(next)
    onToast('TSUN TAPE DECK', `Loaded ${tracks[next].file}. ${tracks[next].label}`)
  }

  return (
    <aside className="now-playing-widget" aria-label="Now playing media widget">
      <div className="now-playing-title">
        <span>NOW PLAYING</span>
        <i className={cn(playing && 'playing')} />
      </div>
      <div className="now-playing-file" onClick={nextTrack} title="Click to change tape">
        <strong>{track.file}</strong>
        <span>{track.label}</span>
        <em>{track.duration} — CLICK TO SWITCH TAPE</em>
      </div>
      <div className="now-playing-visual">
        <div className={cn('visual-bars', playing && 'playing')}>
          <i /><i /><i /><i /><i />
        </div>
        <span>{playing ? 'TSUN IS LISTENING (PRETENDING NOT TO)' : 'STANDBY'}</span>
      </div>
      <div className="now-playing-controls">
        <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'PAUSE' : 'PLAY'}
        </button>
        <button type="button" onClick={stop} aria-label="Stop"><Square size={12} /> STOP</button>
        <button type="button" onClick={nextTrack} aria-label="Next track">NEXT</button>
      </div>
    </aside>
  )
}
