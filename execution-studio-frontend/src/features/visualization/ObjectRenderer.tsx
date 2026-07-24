import React, { useEffect, useRef } from 'react'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import { formatMemoryAddress } from '@/utils/formatMemoryAddress'

interface ObjectRendererProps {
  obj: HeapObjectView
  variableLabels: string[]
  prevObj?: HeapObjectView
  onObjectClick?: (objectId: string) => void
  isNew?: boolean
}

/**
 * Execution Studio V4 — Object Memory Record Renderer.
 * Formatted like paper/textbook memory records:
 *   Person (0x5)
 *   ──────────────
 *   name     ↓ "John"
 *   age      ↓ 20
 *   address  ↓ 0x8
 */
export const ObjectRenderer: React.FC<ObjectRendererProps> = React.memo(({
  obj,
  variableLabels,
  prevObj,
  onObjectClick,
  isNew = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDeveloperMode = usePlaybackStore((s) => s.isDeveloperMode)

  useEffect(() => {
    if (isNew && containerRef.current) {
      containerRef.current.classList.add('es-anim-fade-in')
    }
  }, [isNew])

  const fields = obj.fieldsOrElements ?? {}
  const fieldKeys = Object.keys(fields)
  const simpleName = simplifyClassName(obj.classNameOrType)
  const addressHex = formatMemoryAddress(obj.objectId, isDeveloperMode)
  const varPrefix = variableLabels.length > 0 ? variableLabels.join(', ') : simpleName

  return (
    <div
      ref={containerRef}
      id={`heap-obj-${obj.objectId}`}
      onClick={() => onObjectClick?.(obj.objectId)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 'fit-content',
        minWidth: '220px',
        maxWidth: 'min(420px, 100%)',
        backgroundColor: '#0f172a',
        border: '1.5px solid #a855f7',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(168, 85, 247, 0.12)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flex: '0 1 auto',
      }}
      className={isNew ? 'es-anim-fade-in' : undefined}
    >
      {/* Record Header */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          borderBottom: '1.5px solid #a855f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#c084fc',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {varPrefix}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: '#e9d5ff',
            fontWeight: 'bold',
          }}
        >
          ({addressHex})
        </span>
      </div>

      {/* Fields List */}
      {fieldKeys.length === 0 ? (
        <div
          style={{
            padding: '10px 12px',
            fontSize: '11px',
            color: '#64748b',
            fontStyle: 'italic',
          }}
        >
          (no fields)
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
                isDevMode={isDeveloperMode}
              />
            )
          })}
        </div>
      )}
    </div>
  )
})

ObjectRenderer.displayName = 'ObjectRenderer'

interface ObjectFieldRowProps {
  fieldName: string
  value: DisplayValue
  isChanged: boolean
  isLast: boolean
  isDevMode: boolean
}

const ObjectFieldRow: React.FC<ObjectFieldRowProps> = React.memo(({ fieldName, value, isChanged, isLast, isDevMode }) => {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isChanged && rowRef.current) {
      const el = rowRef.current
      el.classList.remove('es-anim-highlight-flash')
      void el.offsetWidth
      el.classList.add('es-anim-highlight-flash')
    }
  }, [isChanged, value.valueString, value.objectId])

  const display = formatFieldValue(value, isDevMode)
  const isRef = value.kind === 'object_ref' || value.kind === 'array_ref' || !!value.objectId

  return (
    <div
      ref={rowRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        borderBottom: isLast ? 'none' : '1px solid #1e293b',
        fontSize: '12px',
        backgroundColor: isChanged ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
      }}
    >
      <span
        style={{
          color: '#94a3b8',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {fieldName}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '240px' }}>
        <span style={{ color: '#64748b', fontSize: '10px', flexShrink: 0 }}>↓</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            color: isRef ? '#c084fc' : '#f8fafc',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={display}
        >
          {display}
        </span>
      </div>
    </div>
  )
})

ObjectFieldRow.displayName = 'ObjectFieldRow'

function formatFieldValue(val: DisplayValue, isDevMode: boolean): string {
  if (!val) return '?'
  if (val.kind === 'null' || val.value === 'null') return 'null'
  if (val.kind === 'string') return `"${val.valueString ?? ''}"`
  if (val.kind === 'object_ref' || val.kind === 'array_ref' || val.objectId) {
    return formatMemoryAddress(val.objectId ?? val.valueString, isDevMode)
  }
  return String(val.valueString ?? val.value ?? '?')
}

function simplifyClassName(fullName: string): string {
  if (!fullName) return 'Object'
  const parts = fullName.split('.')
  return parts[parts.length - 1] ?? fullName
}

export default ObjectRenderer
