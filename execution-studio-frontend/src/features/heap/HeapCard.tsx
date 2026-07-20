import React from 'react'
import type { HeapObjectView, DisplayValue, VisualizationModel } from '@/types/visualization.types'
import HeapFieldRow from './HeapFieldRow'

interface HeapCardProps {
  obj: HeapObjectView
  previousModel: VisualizationModel | null
}

const checkFieldChanged = (
  objectId: string,
  fieldName: string,
  currentVal: DisplayValue,
  previousModel: VisualizationModel | null,
): boolean => {
  if (!previousModel) return false
  const prevObj = previousModel.heap?.objects?.[objectId]
  if (!prevObj) return false
  const prevVal = prevObj.fieldsOrElements?.[fieldName]
  if (!prevVal) return true
  return (
    prevVal.value !== currentVal.value ||
    prevVal.valueString !== currentVal.valueString ||
    prevVal.objectId !== currentVal.objectId ||
    prevVal.kind !== currentVal.kind
  )
}

/**
 * A memoized Heap Object Debugger Card component.
 * Displays object type header and loops fields in a list.
 */
export const HeapCard: React.FC<HeapCardProps> = React.memo(({ obj, previousModel }) => {
  const fields = obj.fieldsOrElements || {}
  const keys = Object.keys(fields)

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: 'var(--shadow-sm)',
        minWidth: '220px',
      }}
      className="heap-card"
    >
      {/* Card Header showing type name and address ID */}
      <div
        style={{
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '6px',
          fontWeight: 'bold',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-primary)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{obj.classNameOrType}</span>
        <span style={{ color: 'var(--accent-secondary)' }}>@{obj.objectId}</span>
      </div>

      {/* Fields List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {keys.length === 0 ? (
          <div
            style={{
              fontSize: '11px',
              fontStyle: 'italic',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '6px 0',
            }}
          >
            No fields
          </div>
        ) : (
          keys.map((key) => {
            const val = fields[key]
            const changed = checkFieldChanged(obj.objectId, key, val, previousModel)

            return (
              <HeapFieldRow
                key={`${obj.objectId}-${key}`}
                fieldName={key}
                val={val}
                classNameOrType={obj.classNameOrType}
                changed={changed}
              />
            )
          })
        )}
      </div>
    </div>
  )
})

HeapCard.displayName = 'HeapCard'
export default HeapCard
