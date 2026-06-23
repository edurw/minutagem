import { useRef, useEffect, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function ScrollArea({ children, className = '', style }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const [thumbHeight, setThumbHeight] = useState(0)
  const [thumbTop, setThumbTop] = useState(0)
  const [visible, setVisible] = useState(false)
  const [needsScroll, setNeedsScroll] = useState(false)
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartScroll = useRef(0)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function update() {
    const el = contentRef.current
    if (!el) return
    const scrollable = el.scrollHeight > el.clientHeight
    setNeedsScroll(scrollable)

    // Se não há scroll necessário, esconde o thumb imediatamente
    if (!scrollable) {
      setVisible(false)
      clearTimeout(hideTimer.current)
      return
    }

    const BOTTOM_OFFSET = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--scrollbar-bottom').trim()) || 16
    const trackH = el.clientHeight - BOTTOM_OFFSET
    const ratio = trackH / el.scrollHeight
    setThumbHeight(Math.max(ratio * trackH, 32))
    const maxTop = trackH - Math.max(ratio * trackH, 32)
    setThumbTop(Math.min((el.scrollTop / (el.scrollHeight - el.clientHeight)) * maxTop, maxTop))
  }

  function showThumb() {
    // Só mostra o thumb se houver conteúdo scrollável
    if (!needsScroll) return
    setVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setVisible(false), 1200)
  }

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function onScroll() {
    update()
    showThumb()
  }

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    isDragging.current = true
    dragStartY.current = e.clientY
    dragStartScroll.current = contentRef.current?.scrollTop ?? 0

    function onMove(ev: MouseEvent) {
      if (!isDragging.current || !contentRef.current) return
      const el = contentRef.current
      const delta = ev.clientY - dragStartY.current
      const scrollRatio = el.scrollHeight / el.clientHeight
      el.scrollTop = dragStartScroll.current + delta * scrollRatio
    }

    function onUp() {
      isDragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      className={className}
      onMouseEnter={showThumb}
    >
      <div
        ref={contentRef}
        onScroll={onScroll}
        className="scroll-area-inner"
        style={{
          height: '100%',
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 2,
          bottom: 'var(--scrollbar-bottom, 16px)',
          width: 6,
          pointerEvents: 'none',
        }}
      >
        <div
          ref={thumbRef}
          onMouseDown={onMouseDown}
          style={{
            position: 'absolute',
            right: 0,
            width: 6,
            height: thumbHeight,
            top: thumbTop,
            borderRadius: 3,
            background: 'var(--scrollbar-thumb)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s',
            cursor: 'grab',
            pointerEvents: 'auto',
          }}
        />
      </div>
    </div>
  )
}