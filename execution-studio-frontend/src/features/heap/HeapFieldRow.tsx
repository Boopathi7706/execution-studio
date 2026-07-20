import React, { useState, useEffect } from 'react'
import type { DisplayValue } from '@/types/visualization.types'

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
 */
export const HeapFieldRow: React.FC<HeapFieldRowProps> = React.memo(
  ({ fieldName, val, classNameOrType, changed }) => {
    const [isFlashing, setIsFlashing] = useState(false)

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
    const isObject = val.kind === 'object_ref' || val.kind === 'array_ref'
    const isNull = val.kind === 'null'

    let textColor = 'var(--text-primary)'
    if (isNull) textColor = 'var(--text-muted)'
    else if (isObject) textColor = 'var(--accent-secondary)'

    return (
      <div
        className={isFlashing ? 'variable-row-flash' : ''}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 8px',
          fontSize: '12px',
          borderBottom: '1px dashed var(--border-color)',
          transition: 'background-color 0.8s ease-out',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {fieldName}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', color: textColor }}>{formatted}</span>
      </div>
    )
  },
)

HeapFieldRow.displayName = 'HeapFieldRow'
export default HeapFieldRow
