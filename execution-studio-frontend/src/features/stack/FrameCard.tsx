import React, { useRef, useEffect } from 'react'
import type { FrameView } from '@/types/visualization.types'

interface FrameCardProps {
  frame: FrameView
  isActive: boolean
  depth: number
  onClick?: () => void
}

/**
 * Extracts the simple class name and appends .java.
 * Correctly strips packages and nested/anonymous classes ($).
 */
function getSourceFileName(className: string): string {
  if (!className) return 'UnknownSource'
  const parts = className.split('.')
  const simpleName = parts[parts.length - 1]
  const mainClass = simpleName.split('$')[0]
  return `${mainClass}.java`
}

/**
 * A memoized presentational frame card representing a single Java call stack frame.
 * Handles automatic scroll-into-view adjustments when designated as active.
 * Exposes onClick callback for stack selection synchronization.
 */
export const FrameCard: React.FC<FrameCardProps> = React.memo(
  ({ frame, isActive, depth, onClick }) => {
    const cardRef = useRef<HTMLDivElement | null>(null)
    const sourceFile = getSourceFileName(frame.className)

    useEffect(() => {
      if (isActive && cardRef.current) {
        // Automatically scroll active frame card into view inside its container
        cardRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }, [isActive])

    const cardStyle: React.CSSProperties = {
      padding: '10px 14px',
      backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
      borderLeft: isActive ? '3px solid var(--accent-color)' : '3px solid transparent',
      borderBottom: '1px solid var(--border-color)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'background-color var(--transition-fast)',
    }

    return (
      <div
        ref={cardRef}
        style={cardStyle}
        onClick={onClick}
        className={`frame-card ${isActive ? 'active' : ''}`}
      >
        {/* Active Indicator Arrow Gutter */}
        <div
          style={{
            width: '12px',
            color: 'var(--accent-color)',
            fontSize: '11px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {isActive ? '▶' : ''}
        </div>

        {/* Frame Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontWeight: isActive ? '600' : 'normal',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {frame.methodName}()
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#{depth}</span>
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span
              title={frame.className}
              style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: '240px',
              }}
            >
              {frame.className}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {sourceFile}:{frame.lineNumber}
            </span>
          </div>
        </div>
      </div>
    )
  },
)

FrameCard.displayName = 'FrameCard'
export default FrameCard
