import React, { useRef, useState, useCallback, useEffect } from 'react'

interface SplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
  onChange?: (width: number) => void
}

/**
 * A professional, draggable, resizable split panel layout.
 * Divides screen horizontally and supports smooth cursor drags with mouse event listeners.
 */
export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  initialWidth = 600,
  minWidth = 300,
  maxWidth = 1200,
  onChange,
}) => {
  const [leftWidth, setLeftWidth] = useState<number>(initialWidth)
  const isDraggingRef = useRef<boolean>(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left

      // Constrain within boundaries
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setLeftWidth(clampedWidth)

      if (onChange) {
        onChange(clampedWidth)
      }
    },
    [minWidth, maxWidth, onChange],
  )

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Left Panel */}
      <div
        style={{
          width: `${leftWidth}px`,
          minWidth: `${minWidth}px`,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {left}
      </div>

      {/* Draggable Resizer Bar */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '4px',
          height: '100%',
          backgroundColor: 'var(--border-color)',
          cursor: 'col-resize',
          transition: 'background-color var(--transition-fast)',
          position: 'relative',
          zIndex: 10,
        }}
        className="resizer-bar"
      />

      {/* Right Panel */}
      <div
        style={{
          flex: 1,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {right}
      </div>
    </div>
  )
}
export default SplitPane
