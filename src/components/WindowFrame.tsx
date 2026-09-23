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
  onResize: (width: number, height: number) => void
  live?: boolean
}

type ResizeDirection = 'east' | 'south' | 'southeast'

export function WindowFrame({
  definition,
  windowState,
  children,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
  live = false,
}: WindowFrameProps) {
  const dragRef = useRef<{ pointerX: number; pointerY: number; originX: number; originY: number } | null>(null)
  const resizeRef = useRef<{ pointerX: number; pointerY: number; originWidth: number; originHeight: number; direction: ResizeDirection } | null>(null)
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
    if (resizeRef.current && !windowState.maximized) {
      const deltaX = event.clientX - resizeRef.current.pointerX
      const deltaY = event.clientY - resizeRef.current.pointerY
      const maxWidth = Math.max(360, window.innerWidth - windowState.x - 10)
      const maxHeight = Math.max(250, window.innerHeight - windowState.y - 45)
      const width = resizeRef.current.direction === 'south' ? windowState.width : Math.min(maxWidth, Math.max(360, resizeRef.current.originWidth + deltaX))
      const height = resizeRef.current.direction === 'east' ? windowState.height : Math.min(maxHeight, Math.max(250, resizeRef.current.originHeight + deltaY))
      onResize(width, height)
      return
    }
    if (!dragRef.current || windowState.maximized) return
    const workspaceWidth = Math.max(760, window.innerWidth)
    const workspaceHeight = Math.max(600, window.innerHeight - 90)
    const nextX = Math.min(Math.max(12, dragRef.current.originX + event.clientX - dragRef.current.pointerX), Math.max(12, workspaceWidth - 300))
    const nextY = Math.min(Math.max(54, dragRef.current.originY + event.clientY - dragRef.current.pointerY), Math.max(54, workspaceHeight - 140))
    onMove(nextX, nextY)
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = null
    resizeRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const onResizeStart = (event: PointerEvent<HTMLDivElement>, direction: ResizeDirection) => {
    if (windowState.maximized) return
    event.preventDefault()
    event.stopPropagation()
    onFocus()
    resizeRef.current = { pointerX: event.clientX, pointerY: event.clientY, originWidth: windowState.width, originHeight: windowState.height, direction }
    event.currentTarget.setPointerCapture(event.pointerId)
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
      className={cn('window', 'os-window', windowState.maximized && 'is-maximized')}
      style={style}
      onPointerDown={onFocus}
      aria-label={`${definition.title} application window`}
    >
      <header className="title-bar window-header" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <div className="title-bar-text window-title">
          <Icon size={15} strokeWidth={1.8} />
          <span>{definition.title}</span>
          {live && <span className="window-live"><i /> LIVE</span>}
        </div>
        <div className="title-bar-controls window-controls" aria-label="Window controls">
          <button type="button" onClick={onMinimize} aria-label={`Minimize ${definition.title}`}><Minus size={14} /></button>
          <button type="button" onClick={onMaximize} aria-label={`Maximize ${definition.title}`}><Maximize2 size={13} /></button>
          <button type="button" className="window-close" onClick={onClose} aria-label={`Close ${definition.title}`}><X size={14} /></button>
        </div>
      </header>
      <div className="window-body">{children}</div>
      {!windowState.maximized && <>
        <div className="resize-handle resize-east" onPointerDown={(event) => onResizeStart(event, 'east')} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
        <div className="resize-handle resize-south" onPointerDown={(event) => onResizeStart(event, 'south')} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
        <div className="resize-handle resize-southeast" onPointerDown={(event) => onResizeStart(event, 'southeast')} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
      </>}
    </section>
  )
}
