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
 * Displays Method Name, Active Indicator, Class Name, Line Number, and expands
 * on selection to reveal Parameters, Local Variables, and Return details.
 */
export const FrameCard: React.FC<FrameCardProps> = React.memo(
  ({ frame, isActive, depth, onClick }) => {
    const cardRef = useRef<HTMLDivElement | null>(null)
    const sourceFile = getSourceFileName(frame.className)

    useEffect(() => {
      if (isActive && cardRef.current) {
        cardRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }, [isActive])

    const params = (frame.locals || []).filter(
      (v) => v.scope === 'parameter' || v.name.startsWith('arg') || v.name === 'args',
    )
    const locals = (frame.locals || []).filter(
      (v) => !params.some((p) => p.name === v.name),
    )

    const cardStyle: React.CSSProperties = {
      padding: '10px 14px',
      backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
      borderLeft: isActive ? '3px solid var(--accent-color)' : '3px solid transparent',
      borderBottom: '1px solid var(--border-color)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      transition: 'background-color var(--transition-fast)',
    }

    return (
      <div
        ref={cardRef}
        style={cardStyle}
        onClick={onClick}
        className={`frame-card ${isActive ? 'active' : ''}`}
      >
        {/* Frame Header Line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Active Indicator Arrow Gutter */}
          <div
            style={{
              width: '12px',
              color: 'var(--accent-color)',
              fontSize: '11px',
              display: 'flex',
              justifyContent: 'center',
              fontWeight: 'bold',
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
                  maxWidth: '180px',
                }}
              >
                {frame.className}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>
                {sourceFile}:{frame.lineNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Frame Details Accordion when Active/Selected */}
        {isActive && (
          <div
            style={{
              marginTop: '6px',
              paddingTop: '8px',
              borderTop: '1px dashed var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px',
            }}
          >
            {/* Parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>
                Parameters ({params.length})
              </span>
              {params.length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
              ) : (
                params.map((p) => (
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {p.declaredType} {p.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>
                      = {p.value?.valueString || 'null'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Local Variables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>
                Local Variables ({locals.length})
              </span>
              {locals.length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
              ) : (
                locals.map((l) => (
                  <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {l.declaredType} {l.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>
                      = {l.value?.valueString || 'null'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  },
)

FrameCard.displayName = 'FrameCard'
export default FrameCard
