import React, { useEffect, useRef } from 'react'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'

interface LinkedListRendererProps {
  /** All heap objects (needed to follow next/prev links) */
  objects: Record<string, HeapObjectView>
  /** The head-node objectId (the node pointed to by `head` variable) */
  headObjectId: string
  /** Variable labels pointing to the head (e.g. ["head", "list"]) */
  variableLabels: string[]
  /** Previous objects map for changed detection */
  prevObjects?: Record<string, HeapObjectView>
  /** Called when a node is clicked */
  onNodeClick?: (objectId: string) => void
  /** True if this entire list was newly created this step */
  isNew?: boolean
}

const MAX_NODES = 32 // guard against infinite loops

/**
 * Textbook Linked List / Doubly Linked List Renderer.
 *
 * Example (singly):
 *   head
 *    ↓
 *   [10 | •]──►[20 | •]──►[30 | ∅]
 *
 * Circular list:
 *   [10 | •]──►[20 | •]──► ↺ cycle to @n1
 *
 * Supports singly, doubly, and circular linked lists.
 * Never renders as a generic graph node.
 */
export const LinkedListRenderer: React.FC<LinkedListRendererProps> = React.memo(({
  objects,
  headObjectId,
  variableLabels,
  prevObjects,
  onNodeClick,
  isNew = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Walk the linked list chain starting from headObjectId
  const { chain, isCircular, cycleTargetId } = buildChain(objects, headObjectId)

  return (
    <div
      ref={containerRef}
      className={isNew ? 'es-anim-fade-in' : undefined}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px 14px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
      }}
      aria-label="Linked List"
    >
      {/* Variable labels above */}
      {variableLabels.length > 0 && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {variableLabels.map((lbl) => (
            <span
              key={lbl}
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-secondary)',
                fontWeight: 'bold',
              }}
            >
              {lbl}
            </span>
          ))}
        </div>
      )}

      {/* Downward arrow from variable label to first node */}
      <div
        style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          paddingLeft: '8px',
          lineHeight: 1,
        }}
      >
        ↓
      </div>

      {/* Node chain row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0',
          alignItems: 'center',
        }}
      >
        {chain.map((item, idx) => {
          const { obj, nextId, isLast } = item
          const prevObj = prevObjects?.[obj.objectId]
          const changed =
            prevObj !== undefined &&
            didObjectChange(prevObj, obj)

          const showsCycle = isLast && isCircular

          return (
            <React.Fragment key={obj.objectId}>
              <LinkedListNode
                obj={obj}
                prevObj={prevObj}
                isChanged={changed}
                isNew={isNew && idx === chain.length - 1}
                onClick={() => onNodeClick?.(obj.objectId)}
              />
              {/* Arrow to next node, ∅ if null, or ↺ cycle if circular */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: showsCycle ? 'var(--accent-warning)' : isLast ? 'var(--text-muted)' : 'var(--accent-secondary)',
                  fontSize: '13px',
                  padding: '0 4px',
                  flexShrink: 0,
                  fontWeight: showsCycle ? 'bold' : 'normal',
                }}
              >
                {showsCycle
                  ? `──► ↺ cycle to @${cycleTargetId}`
                  : isLast
                  ? (nextId === null ? '──∅' : '──►')
                  : '──►'}
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {/* Doubly linked list prev arrows (if any node has prev) */}
      {chainHasPrev(chain) && (
        <div
          style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            paddingLeft: '8px',
          }}
        >
          ◄── prev pointers (doubly linked)
        </div>
      )}
    </div>
  )
})

LinkedListRenderer.displayName = 'LinkedListRenderer'

// ── Single node box ─────────────────────────────────────────────────────────

interface LinkedListNodeProps {
  obj: HeapObjectView
  prevObj?: HeapObjectView
  isChanged: boolean
  isNew: boolean
  onClick?: () => void
}

const LinkedListNode: React.FC<LinkedListNodeProps> = React.memo(({ obj, isChanged, isNew, onClick }) => {
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if ((isNew || isChanged) && nodeRef.current) {
      const el = nodeRef.current
      el.classList.remove('es-anim-fade-in', 'es-anim-highlight-flash')
      void el.offsetWidth
      el.classList.add(isNew ? 'es-anim-fade-in' : 'es-anim-highlight-flash')
    }
  }, [isNew, isChanged])

  // Extract data field (non-next, non-prev fields)
  const fields = obj.fieldsOrElements ?? {}
  const dataFields = Object.entries(fields).filter(
    ([k]) => !k.toLowerCase().includes('next') && !k.toLowerCase().includes('prev'),
  )

  return (
    <div
      ref={nodeRef}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
        minWidth: '60px',
        backgroundColor: 'var(--bg-tertiary)',
        flexShrink: 0,
        transition: 'border-color 0.15s ease',
      }}
      className={isNew ? 'es-anim-fade-in' : undefined}
      title={`${obj.classNameOrType}@${obj.objectId}`}
    >
      {/* Node data section */}
      <div
        style={{
          padding: '6px 8px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {dataFields.length === 0 ? (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
        ) : (
          dataFields.map(([k, v]) => (
            <span
              key={k}
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
              }}
            >
              {formatNodeValue(v)}
            </span>
          ))
        )}
      </div>
      {/* Node pointer section */}
      <div
        style={{
          padding: '4px 8px',
          backgroundColor: 'rgba(56, 189, 248, 0.06)',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-secondary)',
          textAlign: 'center',
        }}
      >
        •
      </div>
    </div>
  )
})

LinkedListNode.displayName = 'LinkedListNode'

// ── Chain walker ─────────────────────────────────────────────────────────────

interface ChainItem {
  obj: HeapObjectView
  nextId: string | null
  isLast: boolean
}

interface ChainResult {
  chain: ChainItem[]
  isCircular: boolean
  cycleTargetId: string | null
}

function buildChain(
  objects: Record<string, HeapObjectView>,
  startId: string,
): ChainResult {
  const chain: ChainItem[] = []
  const visited = new Set<string>()
  let currentId: string | null = startId
  let isCircular = false
  let cycleTargetId: string | null = null

  while (currentId && chain.length < MAX_NODES) {
    if (visited.has(currentId)) {
      isCircular = true
      cycleTargetId = currentId
      break
    }
    visited.add(currentId)

    const obj = objects[currentId]
    if (!obj) break

    const nextId = findNextId(obj)
    const isLast = nextId === null || !objects[nextId] || visited.has(nextId)

    chain.push({ obj, nextId, isLast })

    if (nextId && visited.has(nextId)) {
      isCircular = true
      cycleTargetId = nextId
      break
    }

    currentId = nextId
  }

  return { chain, isCircular, cycleTargetId }
}

function findNextId(obj: HeapObjectView): string | null {
  const fields = obj.fieldsOrElements ?? {}
  for (const [k, v] of Object.entries(fields)) {
    if (k.toLowerCase() === 'next' || k.toLowerCase().includes('next')) {
      if (v.kind === 'null' || v.value === 'null') return null
      if (v.kind === 'object_ref' || v.kind === 'array_ref' || v.objectId) {
        const id = v.objectId ?? (typeof v.value === 'string' && v.value.startsWith('obj_') ? v.value : null)
        return id ?? null
      }
    }
  }
  return null
}

function chainHasPrev(chain: ChainItem[]): boolean {
  return chain.some(({ obj }) => {
    const fields = obj.fieldsOrElements ?? {}
    return Object.keys(fields).some((k) => k.toLowerCase().includes('prev'))
  })
}

function didObjectChange(prev: HeapObjectView, curr: HeapObjectView): boolean {
  const pf = prev.fieldsOrElements ?? {}
  const cf = curr.fieldsOrElements ?? {}
  for (const k of Object.keys(cf)) {
    const pv = pf[k]
    const cv = cf[k]
    if (!pv) return true
    if (pv.valueString !== cv.valueString || pv.objectId !== cv.objectId) return true
  }
  return false
}

function formatNodeValue(val: DisplayValue): string {
  if (!val) return '?'
  if (val.kind === 'null') return 'null'
  if (val.kind === 'string') return `"${val.valueString ?? ''}"`
  if (val.kind === 'object_ref' || val.kind === 'array_ref') return `@${val.objectId ?? '?'}`
  return String(val.valueString ?? val.value ?? '?')
}

export default LinkedListRenderer
