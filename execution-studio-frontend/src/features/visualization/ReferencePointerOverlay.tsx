import React, { useEffect, useState, useCallback, useRef } from 'react'
import type { FrameView } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import {
  isRectVisibleWithin,
  calculateEdgeGeometry,
  getReferenceArrowColor,
  type CalculatedEdge,
} from './geometryCalculations'

interface ReferencePointerOverlayProps {
  frames: FrameView[]
  objects: Record<string, any>
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Execution Studio V5 — Interactive SVG Reference Pointer Overlay.
 * Connects Call Stack variables to Heap objects with animated bezier curves.
 * Features stable DOM anchors (data-reference-source, data-heap-object-id),
 * endpoint visibility checks (suppresses off-screen viewport pointers),
 * and coalesced requestAnimationFrame measurement scheduling.
 */
export const ReferencePointerOverlay: React.FC<ReferencePointerOverlayProps> = ({
  frames,
  objects,
  containerRef,
}) => {
  const [connections, setConnections] = useState<CalculatedEdge[]>([])
  const hoveredVariableId = usePlaybackStore((s) => s.hoveredVariableId)
  const hoveredObjectId = usePlaybackStore((s) => s.hoveredObjectId)

  const scheduledAnimFrame = useRef<number | null>(null)

  const updateConnections = useCallback(() => {
    if (!containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()

    // Find CallStack viewport & Heap viewport for visibility checking
    const callStackVpEl = containerRef.current.querySelector('[data-viewport="callstack"]')
    const heapVpEl = containerRef.current.querySelector('[data-viewport="heap"]')

    const callStackVpRect = callStackVpEl ? callStackVpEl.getBoundingClientRect() : null
    const heapVpRect = heapVpEl ? heapVpEl.getBoundingClientRect() : null

    const newConns: CalculatedEdge[] = []

    // Collect all local variables from all frames
    frames.forEach((frame, frameIndex) => {
      const locals = frame.locals || []
      locals.forEach((v) => {
        const val = v.value
        if (!val) return
        const objId = val.objectId ?? (typeof val.value === 'string' && val.value.startsWith('obj_') ? val.value : null)
        if (!objId || val.kind === 'null' || val.value === 'null') return

        // 1. Resolve source element via stable data attribute fallback to ID
        const stableSourceSelector = `[data-reference-source="frame-${frameIndex}-${v.name}"]`
        const sourceEl =
          containerRef.current?.querySelector(stableSourceSelector) ||
          document.getElementById(`var-${frame.methodName}-${v.name}`)

        // 2. Resolve target element via stable data attribute fallback to ID
        const stableTargetSelector = `[data-heap-object-id="${objId}"]`
        const targetEl =
          containerRef.current?.querySelector(stableTargetSelector) ||
          document.getElementById(`heap-obj-${objId}`)

        if (sourceEl && targetEl) {
          const vRect = sourceEl.getBoundingClientRect()
          const oRect = targetEl.getBoundingClientRect()

          // 3. Endpoint Visibility Checking
          // If CallStack viewport exists, variable row MUST be visible within it
          if (callStackVpRect && !isRectVisibleWithin(vRect, callStackVpRect)) {
            return
          }

          // If Heap viewport exists, target object MUST be visible within it
          if (heapVpRect && !isRectVisibleWithin(oRect, heapVpRect)) {
            return
          }

          const { startX, startY, endX, endY } = calculateEdgeGeometry(vRect, oRect, containerRect)
          const color = getReferenceArrowColor(v.name)

          newConns.push({
            id: `${frame.methodName}-${frameIndex}-${v.name}-${objId}`,
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

  const scheduleUpdate = useCallback(() => {
    if (scheduledAnimFrame.current !== null) return
    scheduledAnimFrame.current = requestAnimationFrame(() => {
      scheduledAnimFrame.current = null
      updateConnections()
    })
  }, [updateConnections])

  useEffect(() => {
    scheduleUpdate()

    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, true)

    let resizeObserver: ResizeObserver | null = null
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleUpdate()
      })

      // Observe overlay container
      resizeObserver.observe(containerRef.current)

      // Observe CallStack viewport if present
      const csVp = containerRef.current.querySelector('[data-viewport="callstack"]')
      if (csVp) resizeObserver.observe(csVp)

      // Observe Heap viewport if present
      const heapVp = containerRef.current.querySelector('[data-viewport="heap"]')
      if (heapVp) resizeObserver.observe(heapVp)
    }

    return () => {
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate, true)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (scheduledAnimFrame.current !== null) {
        cancelAnimationFrame(scheduledAnimFrame.current)
        scheduledAnimFrame.current = null
      }
    }
  }, [scheduleUpdate, containerRef])

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
        const markerId =
          c.color === '#ef4444'
            ? 'url(#arrow-red)'
            : c.color === '#22c55e'
            ? 'url(#arrow-green)'
            : 'url(#arrow-purple)'

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
              markerEnd={markerId}
              style={{
                transition: 'all 0.15s ease',
              }}
            />
          </g>
        )
      })}
    </svg>
  )
}

export default ReferencePointerOverlay
