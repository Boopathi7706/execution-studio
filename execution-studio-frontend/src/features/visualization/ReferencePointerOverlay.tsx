import React, { useEffect, useState, useCallback } from 'react'
import type { FrameView } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'

interface ArrowConnection {
  id: string
  varName: string
  objectId: string
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
}

interface ReferencePointerOverlayProps {
  frames: FrameView[]
  objects: Record<string, any>
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Execution Studio V4 — Interactive SVG Reference Pointer Overlay.
 * Renders smooth animated bezier arrows connecting Call Stack variables to Heap objects.
 * Matches textbook arrow pointer diagrams (Red for LinkedList head/tail, Green for Arrays, Purple for Objects).
 */
export const ReferencePointerOverlay: React.FC<ReferencePointerOverlayProps> = ({
  frames,
  objects,
  containerRef,
}) => {
  const [connections, setConnections] = useState<ArrowConnection[]>([])
  const hoveredVariableId = usePlaybackStore((s) => s.hoveredVariableId)
  const hoveredObjectId = usePlaybackStore((s) => s.hoveredObjectId)

  const updateConnections = useCallback(() => {
    if (!containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const newConns: ArrowConnection[] = []

    // Collect all local variables from all frames
    frames.forEach((frame) => {
      const locals = frame.locals || []
      locals.forEach((v) => {
        const val = v.value
        if (!val) return
        const objId = val.objectId ?? (typeof val.value === 'string' && val.value.startsWith('obj_') ? val.value : null)
        if (!objId || val.kind === 'null' || val.value === 'null') return

        const varEl = document.getElementById(`var-${frame.methodName}-${v.name}`)
        const objEl = document.getElementById(`heap-obj-${objId}`)

        if (varEl && objEl) {
          const vRect = varEl.getBoundingClientRect()
          const oRect = objEl.getBoundingClientRect()

          const startX = vRect.right - containerRect.left
          const startY = vRect.top + vRect.height / 2 - containerRect.top

          const endX = oRect.left - containerRect.left
          const endY = oRect.top + oRect.height / 2 - containerRect.top

          // Determine arrow color based on variable name or target structure
          let color = '#c084fc' // default purple reference
          const lowerName = v.name.toLowerCase()
          if (lowerName.includes('head') || lowerName.includes('tail') || lowerName.includes('node') || lowerName.includes('list')) {
            color = '#ef4444' // red for linked list references
          } else if (lowerName.includes('arr') || lowerName.includes('array') || lowerName.includes('nums')) {
            color = '#22c55e' // green for array references
          }

          newConns.push({
            id: `${frame.methodName}-${v.name}-${objId}`,
            varName: v.name,
            objectId: objId,
            startX,
            startY,
            endX,
            endY,
            color,
          })
        }
      })
    })

    setConnections(newConns)
  }, [frames, objects, containerRef])

  useEffect(() => {
    updateConnections()
    window.addEventListener('resize', updateConnections)
    const interval = setInterval(updateConnections, 300)
    return () => {
      window.removeEventListener('resize', updateConnections)
      clearInterval(interval)
    }
  }, [updateConnections])

  if (connections.length === 0) return null

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <defs>
        <marker
          id="arrow-red"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
        <marker
          id="arrow-green"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
        </marker>
        <marker
          id="arrow-purple"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#c084fc" />
        </marker>
      </defs>

      {connections.map((c) => {
        const isHovered = hoveredVariableId === c.varName || hoveredObjectId === c.objectId
        const dx = c.endX - c.startX
        const controlX1 = c.startX + dx * 0.4
        const controlY1 = c.startY
        const controlX2 = c.endX - dx * 0.4
        const controlY2 = c.endY

        const pathData = `M ${c.startX} ${c.startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${c.endX} ${c.endY}`
        const markerId = c.color === '#ef4444' ? 'url(#arrow-red)' : c.color === '#22c55e' ? 'url(#arrow-green)' : 'url(#arrow-purple)'

        return (
          <g key={c.id}>
            {/* Glow background line when hovered */}
            {isHovered && (
              <path
                d={pathData}
                fill="none"
                stroke={c.color}
                strokeWidth="6"
                strokeOpacity="0.4"
              />
            )}

            {/* Main reference arrow curve */}
            <path
              d={pathData}
              fill="none"
              stroke={c.color}
              strokeWidth={isHovered ? '2.5' : '1.8'}
              strokeDasharray={isHovered ? 'none' : undefined}
              markerEnd={markerId}
              style={{
                transition: 'all 0.2s ease',
              }}
            />
          </g>
        )
      })}
    </svg>
  )
}

export default ReferencePointerOverlay
