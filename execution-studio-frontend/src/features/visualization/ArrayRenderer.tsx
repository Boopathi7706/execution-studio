import React, { useEffect, useRef } from 'react'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import { formatMemoryAddress } from '@/utils/formatMemoryAddress'

interface ArrayRendererProps {
  variableLabels: string[]
  obj: HeapObjectView
  prevObj?: HeapObjectView
  onCellClick?: (objectId: string) => void
  isNew?: boolean
}

/**
 * Execution Studio V4 — Textbook Array Renderer.
 * Renders arrays as a contiguous memory grid with index headers, array pointer, and separate length block.
 */
export const ArrayRenderer: React.FC<ArrayRendererProps> = React.memo(({
  variableLabels,
  obj,
  prevObj,
  onCellClick,
  isNew = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDeveloperMode = usePlaybackStore((s) => s.isDeveloperMode)

  const fields = obj.fieldsOrElements ?? {}
  const keys = Object.keys(fields).sort((a, b) => {
    const na = parseInt(a, 10)
    const nb = parseInt(b, 10)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })

  useEffect(() => {
    if (isNew && containerRef.current) {
      containerRef.current.classList.add('es-anim-fade-in')
    }
  }, [isNew])

  const addressHex = formatMemoryAddress(obj.objectId, isDeveloperMode)
  const varPrefix = variableLabels.length > 0 ? variableLabels.join(', ') : 'Array'

  return (
    <div
      ref={containerRef}
      id={`heap-obj-${obj.objectId}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '14px 16px',
        backgroundColor: '#0f172a',
        border: '1.5px solid #22c55e',
        borderRadius: '10px',
        maxWidth: '100%',
        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.12)',
      }}
      className={isNew ? 'es-anim-fade-in' : undefined}
    >
      {/* Title & Memory Address */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            color: '#22c55e',
          }}
        >
          {varPrefix} ({addressHex})
        </span>
      </div>

      {keys.length === 0 ? (
        <div
          style={{
            padding: '10px 14px',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#64748b',
            fontSize: '12px',
            fontStyle: 'italic',
          }}
        >
          (empty array)
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Main Array Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Indices */}
            <div style={{ display: 'flex' }}>
              {keys.map((k) => (
                <div
                  key={k}
                  style={{
                    width: '44px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#22c55e',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'bold',
                  }}
                >
                  {k}
                </div>
              ))}
            </div>

            {/* Grid Cells */}
            <div
              style={{
                display: 'flex',
                border: '2px solid #22c55e',
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: '#020617',
              }}
            >
              {keys.map((k, idx) => {
                const val: DisplayValue = fields[k]
                const prevVal = prevObj?.fieldsOrElements?.[k]
                const changed =
                  prevVal !== undefined &&
                  (prevVal.valueString !== val.valueString || prevVal.objectId !== val.objectId)
                const isRef = val.kind === 'object_ref' || val.kind === 'array_ref' || val.kind === 'reference' || !!val.objectId
                const displayVal = formatCellValue(val, isDeveloperMode)

                return (
                  <ArrayCell
                    key={k}
                    value={displayVal}
                    isLast={idx === keys.length - 1}
                    isChanged={changed}
                    isRef={isRef}
                    onClick={isRef && val.objectId ? () => onCellClick?.(val.objectId!) : undefined}
                  />
                )
              })}
            </div>

            {/* Element Pointer Indicator under index 0 */}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
              <div
                style={{
                  width: '44px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: '#22c55e',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span>↑</span>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{varPrefix}[0]</span>
              </div>
            </div>
          </div>

          {/* Length Block */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '2px solid #22c55e',
              borderRadius: '6px',
              backgroundColor: '#020617',
              overflow: 'hidden',
              minWidth: '64px',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'var(--font-mono)',
                padding: '3px 8px',
                width: '100%',
                textAlign: 'center',
                borderBottom: '1px solid #22c55e',
              }}
            >
              length
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: 'var(--font-mono)',
                color: '#f8fafc',
                padding: '8px 12px',
              }}
            >
              {keys.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

ArrayRenderer.displayName = 'ArrayRenderer'

interface ArrayCellProps {
  value: string
  isLast: boolean
  isChanged: boolean
  isRef: boolean
  onClick?: () => void
}

const ArrayCell: React.FC<ArrayCellProps> = React.memo(({ value, isLast, isChanged, isRef, onClick }) => {
  const cellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isChanged && cellRef.current) {
      const el = cellRef.current
      el.classList.remove('es-anim-cell-pulse')
      void el.offsetWidth
      el.classList.add('es-anim-cell-pulse')
    }
  }, [isChanged, value])

  return (
    <div
      ref={cellRef}
      onClick={onClick}
      style={{
        width: '44px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 'bold',
        color: isRef ? '#c084fc' : '#f8fafc',
        borderRight: isLast ? 'none' : '1px solid #334155',
        backgroundColor: isChanged ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
      title={value}
    >
      {value}
    </div>
  )
})

ArrayCell.displayName = 'ArrayCell'

function formatCellValue(val: DisplayValue, isDevMode: boolean): string {
  if (!val) return '?'
  if (val.kind === 'null' || val.value === 'null') return 'null'
  if (val.kind === 'string') return `"${val.valueString ?? val.value ?? ''}"`
  if (val.kind === 'object_ref' || val.kind === 'array_ref' || val.objectId) {
    return formatMemoryAddress(val.objectId ?? val.valueString, isDevMode)
  }
  return String(val.valueString ?? val.value ?? '?')
}

export default ArrayRenderer
