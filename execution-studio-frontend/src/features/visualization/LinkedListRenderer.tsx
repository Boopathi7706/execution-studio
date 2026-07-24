import React, { useEffect, useRef } from 'react'
import type { HeapObjectView } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import { formatMemoryAddress } from '@/utils/formatMemoryAddress'

interface LinkedListRendererProps {
  objects: Record<string, HeapObjectView>
  headObjectId: string
  variableLabels: string[]
  prevObjects?: Record<string, HeapObjectView>
  onNodeClick?: (objectId: string) => void
  isNew?: boolean
}

const MAX_NODES = 32

/**
 * Execution Studio V4 — Textbook Linked List Renderer.
 * Rendered as:
 *   LinkedList
 *    0x1          0x2          0x3          0x4
 *  ┌───┬───┐    ┌───┬───┐    ┌───┬───┐    ┌───┬──────┐
 *  │ 1 │0x2│──► │ 2 │0x3│──► │ 3 │0x4│──► │ 4 │ null │──► null
 *  └───┴───┘    └───┴───┘    └───┴───┘    └───┴──────┘
 *    ↑                                      ↑
 *   head                                   tail
 */
export const LinkedListRenderer: React.FC<LinkedListRendererProps> = React.memo(({
  objects,
  headObjectId,
  variableLabels,
  prevObjects: _prevObjects,
  onNodeClick,
  isNew = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDeveloperMode = usePlaybackStore((s) => s.isDeveloperMode)

  const { chain } = buildChain(objects, headObjectId)

  useEffect(() => {
    if (isNew && containerRef.current) {
      containerRef.current.classList.add('es-anim-fade-in')
    }
  }, [isNew])

  if (chain.length === 0) return null

  // Check which variable points to tail if variable names exist
  const headVar = variableLabels.find((l) => l.toLowerCase().includes('head')) || 'head'
  const tailVar = variableLabels.find((l) => l.toLowerCase().includes('tail')) || 'tail'

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '14px 16px',
        backgroundColor: '#0f172a',
        border: '1.5px solid #ef4444',
        borderRadius: '10px',
        maxWidth: '100%',
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.12)',
      }}
      className={isNew ? 'es-anim-fade-in' : undefined}
    >
      {/* Category Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            color: '#ef4444',
          }}
        >
          LinkedList
        </span>
      </div>

      {/* Chain Container */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap' }}>
        {chain.map((item, idx) => {
          const { obj, nextId, isLast } = item
          const hexAddress = formatMemoryAddress(obj.objectId, isDeveloperMode)
          const nextHexAddress = nextId ? formatMemoryAddress(nextId, isDeveloperMode) : 'null'
          const isHeadNode = idx === 0
          const isTailNode = isLast

          return (
            <React.Fragment key={obj.objectId}>
              <div
                id={`heap-obj-${obj.objectId}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {/* Memory Address header */}
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: '#f87171',
                    fontWeight: 'bold',
                  }}
                >
                  {hexAddress}
                </div>

                {/* Node Box [ data | next ] */}
                <div
                  onClick={() => onNodeClick?.(obj.objectId)}
                  style={{
                    display: 'flex',
                    border: '2px solid #ef4444',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: '#020617',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Data cell */}
                  <div
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 'bold',
                      color: '#f8fafc',
                      borderRight: '1px solid #ef4444',
                    }}
                  >
                    {getNodeDataValue(obj)}
                  </div>
                  {/* Next pointer cell */}
                  <div
                    style={{
                      padding: '8px 10px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 'bold',
                      color: nextId ? '#ef4444' : '#94a3b8',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    }}
                  >
                    {nextHexAddress}
                  </div>
                </div>

                {/* Head / Tail Pointer Labels */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: '24px',
                  }}
                >
                  {(isHeadNode || isTailNode) && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        color: '#ef4444',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 'bold',
                      }}
                    >
                      <span>↑</span>
                      <span>{isHeadNode ? headVar : tailVar}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Arrow connector */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  margin: '0 6px',
                  marginBottom: '20px',
                }}
              >
                ──►
              </div>

              {/* Null terminator after tail */}
              {isLast && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '20px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#94a3b8',
                  }}
                >
                  null
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
})

LinkedListRenderer.displayName = 'LinkedListRenderer'

interface ChainItem {
  obj: HeapObjectView
  nextId: string | null
  isLast: boolean
}

function buildChain(objects: Record<string, HeapObjectView>, startId: string) {
  const chain: ChainItem[] = []
  const visited = new Set<string>()
  let currentId: string | null = startId

  while (currentId && chain.length < MAX_NODES) {
    if (visited.has(currentId)) break
    visited.add(currentId)

    const obj = objects[currentId]
    if (!obj) break

    const nextId = findNextId(obj)
    const isLast = nextId === null || !objects[nextId] || visited.has(nextId)

    chain.push({ obj, nextId, isLast })
    currentId = nextId
  }

  return { chain }
}

function findNextId(obj: HeapObjectView): string | null {
  const fields = obj.fieldsOrElements ?? {}
  for (const [k, v] of Object.entries(fields)) {
    if (k.toLowerCase().includes('next')) {
      if (v.kind === 'null' || v.value === 'null') return null
      const id = v.objectId ?? (typeof v.value === 'string' && v.value.startsWith('obj_') ? v.value : null)
      return id ?? null
    }
  }
  return null
}

function getNodeDataValue(obj: HeapObjectView): string {
  const fields = obj.fieldsOrElements ?? {}
  for (const [k, v] of Object.entries(fields)) {
    if (!k.toLowerCase().includes('next') && !k.toLowerCase().includes('prev')) {
      if (v.kind === 'string') return `"${v.valueString ?? ''}"`
      return String(v.valueString ?? v.value ?? '?')
    }
  }
  return 'data'
}

export default LinkedListRenderer
