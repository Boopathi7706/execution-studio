import React, { useEffect, useRef } from 'react'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'

interface ArrayRendererProps {
  /** Variable name(s) pointing to this array, e.g. ["cars", "arr"] */
  variableLabels: string[]
  /** Heap object for the array */
  obj: HeapObjectView
  /** Previous state of this same object (for change detection) */
  prevObj?: HeapObjectView
  /** Called when a cell is clicked (object reference arrays) */
  onCellClick?: (objectId: string) => void
  /** True if this object was newly allocated this step */
  isNew?: boolean
}

/**
 * Textbook-style Array Renderer.
 * Renders arrays as indexed cell boxes matching CS textbook diagrams.
 *
 * Example:
 *   cars
 *         0      1      2      3
 *   ┌──────┬──────┬──────┬──────┐
 *   │Volvo │ BMW  │ Ford │Mazda │
 *   └──────┴──────┴──────┴──────┘
 *
 * Changed cells animate with a border pulse.
 * New arrays fade in.
 */
export const ArrayRenderer: React.FC<ArrayRendererProps> = React.memo(({
  variableLabels,
  obj,
  prevObj,
  onCellClick,
  isNew = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const fields = obj.fieldsOrElements ?? {}
  const keys = Object.keys(fields).sort((a, b) => {
    const na = parseInt(a, 10)
    const nb = parseInt(b, 10)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })

  // Fade in animation on mount if newly allocated
  useEffect(() => {
    if (isNew && containerRef.current) {
      containerRef.current.classList.add('es-anim-fade-in')
    }
  }, [isNew])

  const typeName = obj.classNameOrType ?? '[]'

  return (
    <div
      ref={containerRef}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '10px 14px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        maxWidth: '100%',
      }}
      className={isNew ? 'es-anim-fade-in' : undefined}
      aria-label={`Array ${typeName}`}
    >
      {/* Variable labels above the array */}
      {variableLabels.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
          {variableLabels.map((label) => (
            <span
              key={label}
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-secondary)',
                fontWeight: 'bold',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Array type label */}
      <span
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        {typeName} [{keys.length}]
      </span>

      {keys.length === 0 ? (
        <div
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            color: 'var(--text-muted)',
            fontSize: '12px',
            fontStyle: 'italic',
          }}
        >
          empty array
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Index row */}
          <div style={{ display: 'flex' }}>
            {keys.map((k) => (
              <div
                key={k}
                style={{
                  minWidth: '52px',
                  textAlign: 'center',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 4px',
                }}
              >
                {k}
              </div>
            ))}
          </div>

          {/* Cell row */}
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            {keys.map((k, idx) => {
              const val: DisplayValue = fields[k]
              const prevVal = prevObj?.fieldsOrElements?.[k]
              const changed =
                prevVal !== undefined &&
                (prevVal.valueString !== val.valueString ||
                  prevVal.objectId !== val.objectId)
              const displayText = formatCellValue(val)
              const isRef = val.kind === 'object_ref' || val.kind === 'array_ref'

              return (
                <ArrayCell
                  key={k}
                  index={idx}
                  value={displayText}
                  isLast={idx === keys.length - 1}
                  isChanged={changed}
                  isRef={isRef}
                  onClick={isRef && val.objectId ? () => onCellClick?.(val.objectId!) : undefined}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})

ArrayRenderer.displayName = 'ArrayRenderer'

// ── Array Cell ──────────────────────────────────────────────────────────────

interface ArrayCellProps {
  index: number
  value: string
  isLast: boolean
  isChanged: boolean
  isRef: boolean
  onClick?: () => void
}

const ArrayCell: React.FC<ArrayCellProps> = React.memo(({ value, isLast, isChanged, isRef, onClick }) => {
  const cellRef = useRef<HTMLDivElement>(null)

  // Trigger pulse animation when cell value changes
  useEffect(() => {
    if (isChanged && cellRef.current) {
      const el = cellRef.current
      el.classList.remove('es-anim-cell-pulse')
      // Force reflow so the animation replays
      void el.offsetWidth
      el.classList.add('es-anim-cell-pulse')
    }
  }, [isChanged, value])

  return (
    <div
      ref={cellRef}
      onClick={onClick}
      style={{
        minWidth: '52px',
        padding: '8px 6px',
        textAlign: 'center',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
        color: isRef ? 'var(--accent-secondary)' : 'var(--text-primary)',
        borderRight: isLast ? 'none' : '1px solid var(--border-color)',
        backgroundColor: isChanged ? undefined : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s ease',
        fontWeight: isRef ? 'bold' : 'normal',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      title={value}
    >
      {value}
    </div>
  )
})

ArrayCell.displayName = 'ArrayCell'

// ── Format cell value for display ──────────────────────────────────────────
function formatCellValue(val: DisplayValue): string {
  if (!val) return '?'
  if (val.kind === 'null' || val.value === 'null') return 'null'
  if (val.kind === 'string') return `"${val.valueString ?? val.value ?? ''}"`
  if (val.kind === 'object_ref' || val.kind === 'array_ref') {
    const id = val.objectId ?? val.valueString
    return id ? `@${id}` : '•'
  }
  return String(val.valueString ?? val.value ?? '?')
}

export default ArrayRenderer
