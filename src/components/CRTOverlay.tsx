interface CRTOverlayProps {
  enabled: boolean
}

export function CRTOverlay({ enabled }: CRTOverlayProps) {
  if (!enabled) return null

  return (
    <div className="crt-overlay" aria-hidden="true">
      <div className="crt-scanlines" />
      <div className="crt-noise" />
      <div className="crt-vignette" />
    </div>
  )
}
