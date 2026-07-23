import React, { useEffect, useRef } from 'react'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'

interface ObjectRendererProps {
  obj: HeapObjectView
  variableLabels: string[]
  prevObj?: HeapObjectView
  onObjectClick?: (objectId: string) => void
  isNew?: boolean
}

/**
 * General Object Memory Card Renderer (fallback for unknown POJOs).
 *
 * Example:
 *   Person @obj_3
 *   ┌──────────────────┐
 *   │ name  │ "Alice"  │
 *   │ age   │ 25       │
 *   │ addr  │ → obj_4  │
 *   └──────────────────┘
 *
 * Object IDs are small and secondary — class name and values are primary.
 */
export const ObjectRenderer: React.FC<ObjectRendererProps> = React.memo(({
  obj,
  variableLabels,
  prevObj,
  onObjectClick,
  isNew = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isNew && containerRef.current) {
      const el = containerRef.current
      el.classList.add('es-anim-fade-in')
    }
  }, [isNew])

  const fields = obj.fieldsOrElements ?? {}
  const fieldKeys = Object.keys(fields)
  const simpleName = simplifyClassName(obj.classNameOrType)

  return (
    <div
      ref={containerRef}
      className={isNew ? 'es-anim-fade-in' : undefined}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        minWidth: '160px',
        maxWidth: '260px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
      }}
      onClick={() => onObjectClick?.(obj.objectId)}
      aria-label={`Object ${simpleName} @${obj.objectId}`}
    >
      {/* Header: variable labels + class name */}
      <div
        style={{
          padding: '6px 10px',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {variableLabels.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {variableLabels.map((lbl) => (
              <span
                key={lbl}
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-secondary)',
                  fontWeight: 'bold',
                }}
              >
                {lbl} →
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: 'var(--accent-color)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {simpleName}
          </span>
          <span
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            @{obj.objectId}
          </span>
        </div>
      </div>

      {/* Fields table */}
      {fieldKeys.length === 0 ? (
        <div
          style={{
            padding: '8px 10px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        >
          no fields
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {fieldKeys.map((k, idx) => {
            const val: DisplayValue = fields[k]
            const prevVal = prevObj?.fieldsOrElements?.[k]
            const changed =
              prevVal !== undefined &&
              (prevVal.valueString !== val.valueString || prevVal.objectId !== val.objectId)
            return (
              <ObjectFieldRow
                key={k}
                fieldName={k}
                value={val}
                isChanged={changed}
                isLast={idx === fieldKeys.length - 1}
              />
            )
          })}
        </div>
      )}
    </div>
  )
})

ObjectRenderer.displayName = 'ObjectRenderer'

// ── Field Row ────────────────────────────────────────────────────────────────

interface ObjectFieldRowProps {
  fieldName: string
  value: DisplayValue
  isChanged: boolean
  isLast: boolean
}

const ObjectFieldRow: React.FC<ObjectFieldRowProps> = React.memo(({ fieldName, value, isChanged, isLast }) => {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isChanged && rowRef.current) {
      const el = rowRef.current
      el.classList.remove('es-anim-highlight-flash')
      void el.offsetWidth
      el.classList.add('es-anim-highlight-flash')
    }
  }, [isChanged, value.valueString, value.objectId])

  const display = formatFieldValue(value)
  const isRef = value.kind === 'object_ref' || value.kind === 'array_ref'

  return (
    <div
      ref={rowRef}
      style={{
        display: 'flex',
        borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
        fontSize: '12px',
      }}
    >
      <div
        style={{
          padding: '5px 8px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          borderRight: '1px solid var(--border-color)',
          minWidth: '70px',
          flexShrink: 0,
        }}
      >
        {fieldName}
      </div>
      <div
        style={{
          padding: '5px 8px',
          fontFamily: 'var(--font-mono)',
          color: isRef ? 'var(--accent-secondary)' : 'var(--text-primary)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={display}
      >
        {display}
      </div>
    </div>
  )
})

ObjectFieldRow.displayName = 'ObjectFieldRow'

function formatFieldValue(val: DisplayValue): string {
  if (!val) return '?'
  if (val.kind === 'null' || val.value === 'null') return 'null'
  if (val.kind === 'string') return `"${val.valueString ?? ''}"`
  if (val.kind === 'object_ref' || val.kind === 'array_ref') {
    return val.objectId ? `→ @${val.objectId}` : '→ obj'
  }
  return String(val.valueString ?? val.value ?? '?')
}

function simplifyClassName(fullName: string): string {
  if (!fullName) return 'Object'
  const parts = fullName.split('.')
  return parts[parts.length - 1] ?? fullName
}

export default ObjectRenderer
