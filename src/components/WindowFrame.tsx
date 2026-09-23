import { Maximize2, Minus, X } from 'lucide-react'
import { type PointerEvent, type ReactNode, useRef } from 'react'
import type { DesktopWindow, TsunAppDefinition } from '../types'
import { cn } from '../lib/format'

interface WindowFrameProps {
  definition: TsunAppDefinition
  windowState: DesktopWindow
  children: ReactNode
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onMove: (x: number, y: number) => void
  live?: boolean
}

export function WindowFrame({
  definition,
  windowState,
  children,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  live = false,
}: WindowFrameProps) {
  const dragRef = useRef<{ pointerX: number; pointerY: number; originX: number; originY: number } | null>(null)
  const Icon = definition.icon

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (windowState.maximized || (event.target as HTMLElement).closest('button')) return
    onFocus()
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: windowState.x,
      originY: windowState.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || windowState.maximized) return
    const workspaceWidth = Math.max(760, window.innerWidth)
    const workspaceHeight = Math.max(600, window.innerHeight - 90)
    const nextX = Math.min(Math.max(12, dragRef.current.originX + event.clientX - dragRef.current.pointerX), Math.max(12, workspaceWidth - 300))
    const nextY = Math.min(Math.max(54, dragRef.current.originY + event.clientY - dragRef.current.pointerY), Math.max(54, workspaceHeight - 140))
    onMove(nextX, nextY)
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const style = windowState.maximized
    ? { zIndex: windowState.zIndex }
    : {
        zIndex: windowState.zIndex,
        left: windowState.x,
        top: windowState.y,
        width: windowState.width,
        height: windowState.height,
      }

  return (
    <section
      className={cn('os-window', windowState.maximized && 'is-maximized')}
      style={style}
      onPointerDown={onFocus}
      aria-label={`${definition.title} application window`}
    >
      <header className="window-header" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <div className="window-title">
          <Icon size={15} strokeWidth={1.8} />
          <span>{definition.title}</span>
          {live && <span className="window-live"><i /> LIVE</span>}
        </div>
        <div className="window-controls" aria-label="Window controls">
          <button type="button" onClick={onMinimize} aria-label={`Minimize ${definition.title}`}><Minus size={14} /></button>
          <button type="button" onClick={onMaximize} aria-label={`Maximize ${definition.title}`}><Maximize2 size={13} /></button>
          <button type="button" className="window-close" onClick={onClose} aria-label={`Close ${definition.title}`}><X size={14} /></button>
        </div>
      </header>
      <div className="window-body">{children}</div>
    </section>
  )
}
