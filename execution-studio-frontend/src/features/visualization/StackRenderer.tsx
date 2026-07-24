import React, { useEffect, useRef } from 'react'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'

interface StackRendererProps {
  obj: HeapObjectView
  variableLabels: string[]
  prevObj?: HeapObjectView
  onNodeClick?: (objectId: string) => void
  isNew?: boolean
}

/**
 * Vertical Stack Renderer.
 *
 * TOP
 * ┌──────┐
 * │  30  │  ← most recently pushed
 * ├──────┤
 * │  20  │
 * ├──────┤
 * │  10  │
 * └──────┘
 * BOTTOM
 */
export const StackRenderer: React.FC<StackRendererProps> = React.memo(({
  obj,
  variableLabels,
  prevObj,
  isNew = false,
}) => {
  const fields = obj.fieldsOrElements ?? {}
  const keys = Object.keys(fields).sort((a, b) => {
    const na = parseInt(a, 10)
    const nb = parseInt(b, 10)
    if (!isNaN(na) && !isNaN(nb)) return nb - na // reverse: top = highest index
    return b.localeCompare(a)
  })

  return (
    <div
      className={isNew ? 'es-anim-fade-in' : undefined}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px 14px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        minWidth: '100px',
      }}
      aria-label={`Stack ${obj.classNameOrType}`}
    >
      {variableLabels.length > 0 && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {variableLabels.map((lbl) => (
            <span key={lbl} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#f59e0b', fontWeight: 'bold' }}>
              {lbl}
            </span>
          ))}
        </div>
      )}

      {/* TOP label */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--accent-warning)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Top
      </div>

      {/* Stack items — top to bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        {keys.length === 0 ? (
          <div style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            empty
          </div>
        ) : (
          keys.map((k, idx) => {
            const val: DisplayValue = fields[k]
            const prevVal = prevObj?.fieldsOrElements?.[k]
            const changed = prevVal !== undefined && (prevVal.valueString !== val.valueString || prevVal.objectId !== val.objectId)
            return (
              <StackCell key={k} value={formatValue(val)} isTop={idx === 0} isChanged={changed} />
            )
          })
        )}
      </div>

      {/* BOTTOM label */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Bottom
      </div>
    </div>
  )
})

StackRenderer.displayName = 'StackRenderer'

const StackCell: React.FC<{ value: string; isTop: boolean; isChanged: boolean }> = React.memo(({ value, isTop, isChanged }) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isChanged && ref.current) {
      const el = ref.current
      el.classList.remove('es-anim-cell-pulse')
      void el.offsetWidth
      el.classList.add('es-anim-cell-pulse')
    }
  }, [isChanged, value])
  return (
    <div
      ref={ref}
      style={{
        padding: '7px 14px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        fontWeight: isTop ? 'bold' : 'normal',
        color: isTop ? 'var(--accent-warning)' : 'var(--text-primary)',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: isTop ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
      }}
    >
      {value}
    </div>
  )
})

StackCell.displayName = 'StackCell'

function formatValue(val: DisplayValue): string {
  if (!val) return '?'
  if (val.kind === 'null') return 'null'
  if (val.kind === 'string') return `"${val.valueString ?? ''}"`
  return String(val.valueString ?? val.value ?? '?')
}

export default StackRenderer
