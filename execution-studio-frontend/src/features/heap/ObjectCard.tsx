import React, { useRef, useEffect } from 'react'
import type { HeapObjectView, DisplayValue, VisualizationModel } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import HeapFieldRow from './HeapFieldRow'

interface ObjectCardProps {
  obj: HeapObjectView
  isExpanded: boolean
  onToggleExpand: () => void
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
 * Debugger-style Object Card for standard Java object instances.
 */
export const ObjectCard: React.FC<ObjectCardProps> = React.memo(
  ({ obj, isExpanded, onToggleExpand, previousModel }) => {
    const cardRef = useRef<HTMLDivElement | null>(null)
    const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
    const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)

    const isSelected = selectedObjectId === obj.objectId
    const fields = obj.fieldsOrElements || {}
    const keys = Object.keys(fields)

    useEffect(() => {
      if (isSelected && cardRef.current) {
        cardRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }, [isSelected])

    const handleCardClick = () => {
      if (isSelected) {
        setSelectedObjectId(null)
      } else {
        setSelectedObjectId(obj.objectId)
      }
    }

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleExpand()
    }

    return (
      <div
        ref={cardRef}
        onClick={handleCardClick}
        style={{
          backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.08)' : 'var(--bg-tertiary)',
          border: isSelected ? '1.5px solid var(--accent-color)' : '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: isSelected ? '0 0 8px rgba(168, 85, 247, 0.3)' : 'var(--shadow-sm)',
          minWidth: '240px',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
        className="heap-card object-card"
        aria-selected={isSelected}
      >
        {/* Card Header showing Class Type, @Address ID, and Expand/Collapse Button */}
        <div
          style={{
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '6px',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontWeight: 'bold',
                color: isSelected ? 'var(--accent-secondary)' : 'var(--text-primary)',
              }}
            >
              {obj.classNameOrType}
            </span>
            <span style={{ color: 'var(--accent-secondary)', fontSize: '12px' }}>
              @{obj.objectId}
            </span>
          </div>

          <button
            onClick={handleToggle}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            title={isExpanded ? 'Collapse Fields' : 'Expand Fields'}
            aria-label={isExpanded ? 'Collapse Fields' : 'Expand Fields'}
          >
            {isExpanded ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>

        {/* Fields Section */}
        {isExpanded && (
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
        )}
      </div>
    )
  },
)

ObjectCard.displayName = 'ObjectCard'
export default ObjectCard
