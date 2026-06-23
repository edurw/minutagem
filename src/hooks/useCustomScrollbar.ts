import { useEffect, useRef } from 'react'

const SCROLLBAR_WIDTH = 6

export function useCustomScrollbar() {
  const rafRef = useRef<Map<string, HTMLElement>>(new Map())
  const thumbRef = useRef<Map<string, HTMLElement>>(new Map())
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartScrollTop = useRef(0)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const styleElRef = useRef<HTMLStyleElement | null>(null)

  function injectStyles() {
    const isDark = !document.body.classList.contains('light-theme')
    const thumbColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'
    const thumbHover = isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.28)'

    let styleEl = styleElRef.current
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'custom-scrollbar-style'
      document.head.appendChild(styleEl)
      styleElRef.current = styleEl
    }

    styleEl.textContent = `
      * {
        scrollbar-width: none !important;
        scrollbar-gutter: stable !important;
      }
      *::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
      *::-webkit-scrollbar-button {
        display: none !important;
      }
      *::-webkit-scrollbar-track-piece {
        display: none !important;
      }
      .custom-scrollbar {
        position: relative;
        overflow: hidden !important;
      }
      .custom-scrollbar > .custom-scrollbar-inner {
        height: 100%;
        overflow-y: scroll !important;
        overflow-x: hidden !important;
      }
      .custom-scrollbar-track {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: ${SCROLLBAR_WIDTH}px;
        background: transparent;
        z-index: 9999;
        pointer-events: none;
        box-sizing: border-box;
      }
      .custom-scrollbar-thumb {
        position: absolute;
        right: 0;
        width: ${SCROLLBAR_WIDTH}px;
        border-radius: ${SCROLLBAR_WIDTH / 2}px;
        background: ${thumbColor};
        transition: background 0.2s, opacity 0.2s;
        cursor: pointer;
        pointer-events: auto;
        opacity: 0;
      }
      .custom-scrollbar-thumb.visible {
        opacity: 1;
      }
      .custom-scrollbar-thumb.dragging {
        background: ${thumbHover};
        opacity: 1;
      }
      .custom-scrollbar:hover .custom-scrollbar-thumb {
        opacity: 1;
      }
    `
  }

  function updateThumb(el: HTMLElement, thumb: HTMLElement) {
    const inner = el.querySelector<HTMLElement>('.custom-scrollbar-inner')
    if (!inner) return
    const { scrollTop, scrollHeight, clientHeight } = inner
    const scrollableHeight = scrollHeight - clientHeight

    if (scrollableHeight <= 0) {
      thumb.style.display = 'none'
      return
    }

    thumb.style.display = 'block'
    const thumbHeightRatio = clientHeight / scrollHeight
    const thumbHeight = Math.max(30, clientHeight * thumbHeightRatio)
    const maxThumbTop = clientHeight - SCROLLBAR_WIDTH
    const scrollable = maxThumbTop - thumbHeight
    const thumbTop = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * scrollable : 0

    thumb.style.height = `${thumbHeight}px`
    thumb.style.top = `${thumbTop}px`

    // Auto-hide
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => {
      if (!isDragging.current) thumb.classList.remove('visible')
    }, 1500)
  }

  useEffect(() => {
    injectStyles()

    // Watch theme changes
    const observer = new MutationObserver(() => injectStyles())
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    function wrapScrollableElement(el: HTMLElement) {
      if (el.dataset.customScrollbarInit === 'true') return
      el.dataset.customScrollbarInit = 'true'
      el.dataset.scrollId = Math.random().toString(36).slice(2)
      el.classList.add('custom-scrollbar')

      const id = el.dataset.scrollId
      const scrollContent = document.createElement('div')
      scrollContent.className = 'custom-scrollbar-inner'
      scrollContent.style.cssText = 'height:100%;overflow-y:scroll;overflow-x:hidden;'

      // Move all children into inner
      while (el.firstChild) scrollContent.appendChild(el.firstChild)
      el.appendChild(scrollContent)

      const track = document.createElement('div')
      track.className = 'custom-scrollbar-track'
      const thumb = document.createElement('div')
      thumb.className = 'custom-scrollbar-thumb'
      track.appendChild(thumb)
      el.appendChild(track)

      rafRef.current.set(id, el)
      thumbRef.current.set(id, thumb)

      // Scroll sync
      scrollContent.addEventListener('scroll', () => updateThumb(el, thumb), { passive: true })

      // Mouse interactions
      el.addEventListener('mouseenter', () => thumb.classList.add('visible'))
      el.addEventListener('mouseleave', () => {
        if (!isDragging.current) thumb.classList.remove('visible')
      })

      // Drag thumb
      thumb.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        isDragging.current = true
        dragStartY.current = e.clientY
        const inner = el.querySelector<HTMLElement>('.custom-scrollbar-inner')!
        dragStartScrollTop.current = inner.scrollTop
        thumb.classList.add('dragging')
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'grab'
      })

      updateThumb(el, thumb)
    }

    function resizeAll() {
      rafRef.current.forEach((el, id) => {
        const thumb = thumbRef.current.get(id)
        if (thumb) updateThumb(el, thumb)
      })
    }
    window.addEventListener('resize', resizeAll)

    // Observe DOM
    const mo = new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>('.tab-panel, .sidebar, .content').forEach(wrapScrollableElement)
    })
    mo.observe(document.body, { childList: true, subtree: true })

    // Initial
    document.querySelectorAll<HTMLElement>('.tab-panel, .sidebar, .content').forEach(wrapScrollableElement)

    return () => {
      observer.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', resizeAll)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  // Global drag
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return
      rafRef.current.forEach((el, id) => {
        const thumb = thumbRef.current.get(id)
        if (!thumb || !thumb.classList.contains('dragging')) return
        const inner = el.querySelector<HTMLElement>('.custom-scrollbar-inner')
        if (!inner) return
        const { scrollHeight, clientHeight } = inner
        const scrollable = scrollHeight - clientHeight
        const maxThumbTop = clientHeight - SCROLLBAR_WIDTH
        const thumbHeight = Math.max(30, clientHeight * (clientHeight / scrollHeight))
        const scrollableThumb = maxThumbTop - thumbHeight
        if (scrollable <= 0 || scrollableThumb <= 0) return
        const ratio = scrollable / scrollableThumb
        inner.scrollTop = dragStartScrollTop.current + (e.clientY - dragStartY.current) * ratio
      })
    }

    function onMouseUp() {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      thumbRef.current.forEach((t) => t.classList.remove('dragging'))
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])
}
