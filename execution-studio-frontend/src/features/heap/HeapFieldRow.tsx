import React, { useState, useEffect } from 'react'
import type { DisplayValue } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'

// Formats display values inside Heap Object cards
function formatHeapValue(val: DisplayValue, classNameOrType: string): string {
  if (!val || val.kind === 'null') return 'null'

  const rawVal = val.value ?? val.valueString ?? ''

  // Check if collection
  if (
    classNameOrType &&
    (classNameOrType.includes('List') ||
      classNameOrType.includes('Set') ||
      classNameOrType.includes('Map'))
  ) {
    if (rawVal.includes('size=')) return rawVal
    return `${classNameOrType}(size=${rawVal || '0'})`
  }

  switch (val.kind) {
    case 'primitive':
      return rawVal
    case 'string':
      if (rawVal.startsWith('"') && rawVal.endsWith('"')) return rawVal
      return `"${rawVal}"`
    case 'object_ref':
      if (rawVal.includes('@')) return rawVal
      return `@${val.objectId || rawVal}`
    case 'array_ref':
      if (rawVal.includes('[')) return rawVal
      return `${classNameOrType}`
    default:
      return rawVal || 'null'
  }
}

interface HeapFieldRowProps {
  fieldName: string
  val: DisplayValue
  classNameOrType: string
  changed: boolean
}

/**
 * A memoized single field row inside a Heap Object card.
 * Triggers highlight animations if changed is true.
 * Integrates object reference highlighting and click actions.
 */
export const HeapFieldRow: React.FC<HeapFieldRowProps> = React.memo(
  ({ fieldName, val, classNameOrType, changed }) => {
    const [isFlashing, setIsFlashing] = useState(false)

    const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
    const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)

    const isObject = val?.kind === 'object_ref' || val?.kind === 'array_ref'
    const refId = val?.objectId || val?.value || val?.valueString
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
        e.stopPropagation() // Prevent parent HeapCard click trigger
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
