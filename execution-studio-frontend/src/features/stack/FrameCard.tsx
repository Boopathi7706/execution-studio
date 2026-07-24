import React, { useRef, useEffect } from 'react'
import type { FrameView, VariableView } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import { formatMemoryAddress } from '@/utils/formatMemoryAddress'
import { useHeapNavigation } from '@/features/visualization/useHeapNavigation'

interface FrameCardProps {
  frame: FrameView
  isActive: boolean
  depth: number
  frameIndex?: number
  onClick?: () => void
}

/**
 * Execution Studio V4 — Educational Stack Frame Card.
 * Matches textbook call stack frame design with memory reference pointers.
 */
export const FrameCard: React.FC<FrameCardProps> = React.memo(({ frame, isActive, depth: _depth, frameIndex = 0, onClick }) => {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const isDeveloperMode = usePlaybackStore((s) => s.isDeveloperMode)
  const hoveredVariableId = usePlaybackStore((s) => s.hoveredVariableId)
  const setHoveredVariableId = usePlaybackStore((s) => s.setHoveredVariableId)
  const setHoveredObjectId = usePlaybackStore((s) => s.setHoveredObjectId)
  const { navigateToHeapObject } = useHeapNavigation()

  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [isActive])

  const allVars: VariableView[] = frame.locals || []

  const displayMethodName =
    frame.methodName === '<init>'
      ? (frame.className ? frame.className.split('.').pop() : 'Object')
      : frame.methodName

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      style={{
        padding: '12px 14px',
        margin: '6px 10px',
        backgroundColor: isActive ? 'rgba(147, 51, 234, 0.08)' : 'rgba(15, 23, 42, 0.6)',
        border: isActive ? '1.5px solid rgba(192, 132, 252, 0.6)' : '1px solid var(--border-color)',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? '0 0 12px rgba(192, 132, 252, 0.15)' : 'none',
      }}
      className={`frame-card ${isActive ? 'active' : ''}`}
    >
      {/* Frame Header Line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isActive ? '#c084fc' : '#64748b',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontWeight: '700',
              color: isActive ? '#f8fafc' : '#94a3b8',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {displayMethodName}()
          </span>
          {frame.returnValue && (
            <span
              style={{
                fontSize: '11px',
                color: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ↩ {frame.returnValue.valueString || String(frame.returnValue.value ?? 'null')}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: isActive ? '#c084fc' : '#64748b',
          }}
        >
          Line {frame.lineNumber}
        </span>
      </div>

      {/* Variables Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Variables
        </div>

        {allVars.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', paddingLeft: '4px' }}>
            (no variables)
          </div>
        ) : (
          allVars.map((v) => {
            const val = v.value
            const isRef = val?.kind === 'object_ref' || val?.kind === 'array_ref' || !!val?.objectId
            const isNull = val?.kind === 'null' || val?.valueString === 'null' || val?.value === 'null'
            const targetObjId = val?.objectId ?? (typeof val?.value === 'string' && val?.value.startsWith('obj_') ? val?.value : null)
            const displayValStr = isNull
              ? 'null'
              : isRef && targetObjId
                ? formatMemoryAddress(targetObjId, isDeveloperMode)
                : (val?.valueString ?? String(val?.value ?? '?'))

            const isHovered = hoveredVariableId === v.name
            const isNavigational = isRef && !isNull && !!targetObjId

            const handleRefClick = (e: React.MouseEvent | React.KeyboardEvent) => {
              if (isNavigational && targetObjId) {
                e.stopPropagation()
                navigateToHeapObject(targetObjId)
              }
            }

            const handleKeyDown = (e: React.KeyboardEvent) => {
              if (isNavigational && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                handleRefClick(e)
              }
            }

            return (
              <div
                key={v.name}
                id={`var-${frame.methodName}-${v.name}`}
                data-reference-source={`frame-${frameIndex}-${v.name}`}
                onMouseEnter={() => {
                  setHoveredVariableId(v.name)
                  if (targetObjId) setHoveredObjectId(targetObjId)
                }}
                onMouseLeave={() => {
                  setHoveredVariableId(null)
                  setHoveredObjectId(null)
                }}
                onClick={isNavigational ? handleRefClick : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: isHovered ? 'rgba(192, 132, 252, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                  border: isHovered ? '1px solid rgba(192, 132, 252, 0.4)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  cursor: isNavigational ? 'pointer' : 'default',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#f8fafc',
                    fontWeight: '500',
                  }}
                >
                  {v.name}
                </span>

                <div
                  role={isNavigational ? 'button' : undefined}
                  tabIndex={isNavigational ? 0 : undefined}
                  aria-label={isNavigational ? `Navigate to heap object ${targetObjId}` : undefined}
                  onClick={isNavigational ? handleRefClick : undefined}
                  onKeyDown={isNavigational ? handleKeyDown : undefined}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: isRef && !isNull ? 'rgba(192, 132, 252, 0.2)' : '#0f172a',
                    border: `1px solid ${isRef && !isNull ? 'rgba(192, 132, 252, 0.5)' : '#334155'}`,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: isNull ? '#94a3b8' : isRef ? '#c084fc' : '#38bdf8',
                    minWidth: '36px',
                    textAlign: 'center',
                    cursor: isNavigational ? 'pointer' : 'default',
                    outline: 'none',
                  }}
                >
                  {displayValStr}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
})

FrameCard.displayName = 'FrameCard'
export default FrameCard
