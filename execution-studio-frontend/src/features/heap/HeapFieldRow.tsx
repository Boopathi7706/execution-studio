import React, { useState, useEffect } from 'react'
import type { DisplayValue } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'

function formatHeapValue(val: DisplayValue, classNameOrType: string): string {
  if (!val || val.kind === 'null') return 'null'

  const rawVal = val.value !== undefined ? val.value : val.valueString ?? ''

  switch (val.kind) {
    case 'int':
    case 'long':
    case 'short':
    case 'byte':
    case 'float':
    case 'double':
    case 'primitive':
      return rawVal !== undefined && rawVal !== null ? String(rawVal) : '0'

    case 'boolean':
      return String(Boolean(rawVal))

    case 'char': {
      const charStr = String(rawVal ?? '')
      if (charStr.startsWith("'") && charStr.endsWith("'")) return charStr
      return `'${charStr}'`
    }

    case 'string': {
      const str = String(rawVal ?? '')
      if (str.startsWith('"') && str.endsWith('"')) return str
      return `"${str}"`
    }

    case 'object_ref': {
      const refId = val.objectId || (typeof rawVal === 'string' ? rawVal : '')
      if (refId) {
        if (refId.startsWith('@')) return refId
        return `@${refId}`
      }
      return `${classNameOrType || 'Object'}@ref`
    }

    case 'array_ref': {
      const refId = val.objectId || (typeof rawVal === 'string' ? rawVal : '')
      if (refId) {
        if (refId.startsWith('@')) return refId
        return `@${refId}`
      }
      return `${classNameOrType || 'Array'}@ref`
    }

    case 'null':
      return 'null'

    default:
      if (rawVal !== undefined && rawVal !== null) {
        return String(rawVal)
      }
      return 'null'
  }
}

interface HeapFieldRowProps {
  fieldName: string
  val: DisplayValue
  classNameOrType: string
  changed: boolean
}

/**
 * A memoized single field/element row inside Heap Object and Array cards.
 * Triggers highlight animations when values change and provides clickable object reference navigation.
 */
export const HeapFieldRow: React.FC<HeapFieldRowProps> = React.memo(
  ({ fieldName, val, classNameOrType, changed }) => {
    const [isFlashing, setIsFlashing] = useState(false)

    const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
    const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)

    const isObject = val?.kind === 'object_ref' || val?.kind === 'array_ref'
    const rawRefId = val?.objectId || (typeof val?.value === 'string' ? val.value : val?.valueString)
    const refId = rawRefId ? rawRefId.replace(/^@/, '') : null
    const hasRefId = isObject && refId && refId !== 'null' && refId !== '0x0000'
    const isSelected = hasRefId && refId === selectedObjectId

    useEffect(() => {
      if (changed) {
        setIsFlashing(true)
        const timer = setTimeout(() => {
          setIsFlashing(false)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }, [val, changed])

    const formatted = formatHeapValue(val, classNameOrType)
    const isNull = val?.kind === 'null'

    let textColor = 'var(--text-primary)'
    if (isNull) textColor = 'var(--text-muted)'
    else if (isObject) textColor = 'var(--accent-secondary)'

    const handleRowClick = (e: React.MouseEvent) => {
      if (hasRefId && refId) {
        e.stopPropagation() // Prevent parent Card click trigger
        if (isSelected) {
          setSelectedObjectId(null)
        } else {
          setSelectedObjectId(refId)
        }
      }
    }

    return (
      <div
        className={isFlashing ? 'variable-row-flash' : ''}
        onClick={handleRowClick}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 8px',
          fontSize: '12px',
          borderBottom: '1px dashed var(--border-color)',
          transition: 'background-color 0.8s ease-out',
          cursor: hasRefId ? 'pointer' : 'default',
          backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {fieldName}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            color: isSelected ? 'var(--accent-color)' : textColor,
            fontWeight: isSelected ? 'bold' : 'normal',
          }}
        >
          {formatted}
        </span>
      </div>
    )
  },
)

HeapFieldRow.displayName = 'HeapFieldRow'
export default HeapFieldRow
