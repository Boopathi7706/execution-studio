import React, { useEffect, useRef } from 'react'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'

interface QueueRendererProps {
  obj: HeapObjectView
  variableLabels: string[]
  prevObj?: HeapObjectView
  onNodeClick?: (objectId: string) => void
  isNew?: boolean
}

/**
 * Horizontal Queue Renderer.
 *
 * FRONT                    REAR
 *   ┌────┬────┬────┬────┐
 *   │ 10 │ 20 │ 30 │ 40 │  dequeue ← ... enqueue →
 *   └────┴────┴────┴────┘
 */
export const QueueRenderer: React.FC<QueueRendererProps> = React.memo(({
  obj,
  variableLabels,
  prevObj,
  isNew = false,
}) => {
  const fields = obj.fieldsOrElements ?? {}
  const keys = Object.keys(fields).sort((a, b) => {
    const na = parseInt(a, 10)
    const nb = parseInt(b, 10)
    if (!isNaN(na) && !isNaN(nb)) return na - nb // front = lowest index
    return a.localeCompare(b)
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
      }}
      aria-label={`Queue ${obj.classNameOrType}`}
    >
      {variableLabels.length > 0 && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {variableLabels.map((lbl) => (
            <span key={lbl} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ec4899', fontWeight: 'bold' }}>
              {lbl}
            </span>
          ))}
        </div>
      )}

      {/* FRONT / REAR label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
        <span style={{ color: '#ec4899', fontWeight: 'bold' }}>Front</span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>Rear</span>
      </div>

      {/* Queue cells row */}
      <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        {keys.length === 0 ? (
          <div style={{ padding: '8px 14px', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
            empty
          </div>
        ) : (
          keys.map((k, idx) => {
            const val: DisplayValue = fields[k]
            const prevVal = prevObj?.fieldsOrElements?.[k]
            const changed = prevVal !== undefined && (prevVal.valueString !== val.valueString || prevVal.objectId !== val.objectId)
            return (
              <QueueCell
                key={k}
                value={formatValue(val)}
                isFront={idx === 0}
                isLast={idx === keys.length - 1}
                isChanged={changed}
              />
            )
          })
        )}
      </div>

      {/* Direction labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
        <span>← dequeue</span>
        <span>enqueue →</span>
      </div>
    </div>
  )
})

QueueRenderer.displayName = 'QueueRenderer'

const QueueCell: React.FC<{ value: string; isFront: boolean; isLast: boolean; isChanged: boolean }> = React.memo(({ value, isFront, isLast, isChanged }) => {
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
        minWidth: '48px',
        padding: '7px 10px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        color: isFront ? '#ec4899' : 'var(--text-primary)',
        fontWeight: isFront ? 'bold' : 'normal',
        borderRight: isLast ? 'none' : '1px solid var(--border-color)',
        backgroundColor: isFront ? 'rgba(236, 72, 153, 0.07)' : 'transparent',
      }}
    >
      {value}
    </div>
  )
})

QueueCell.displayName = 'QueueCell'

function formatValue(val: DisplayValue): string {
  if (!val) return '?'
  if (val.kind === 'null') return 'null'
  if (val.kind === 'string') return `"${val.valueString ?? ''}"`
  return String(val.valueString ?? val.value ?? '?')
}

export default QueueRenderer
