import React from 'react'
import { usePlaybackStore, type TraceEvent } from '@/store/usePlaybackStore'

/**
 * Execution Event Log Panel.
 * Records step-by-step execution history (method entry, line execution, object allocations, frame returns).
 */
export const ExecutionEventLogPanel: React.FC = () => {
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const timeline = usePlaybackStore((state) => state.timeline)
  const currentFrameIndex = usePlaybackStore((state) => state.currentFrameIndex)
  const jumpToFrame = usePlaybackStore((state) => state.jumpToFrame)

  const isConnected = connectionStatus === 'CONNECTED'

  if (!isConnected || timeline.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontStyle: 'italic',
        }}
        className="event-log-empty"
      >
        No execution events logged.
      </div>
    )
  }

  return (
    <div
      tabIndex={0}
      aria-label="Execution Event Log Timeline"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--bg-secondary)',
        overflowY: 'auto',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
      }}
      className="event-log-panel"
    >
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)',
          fontWeight: 'bold',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Step #</span>
        <span>Executing Target Method</span>
        <span>Line #</span>
      </div>

      {timeline.map((event: TraceEvent, index: number) => {
        const isActive = index === currentFrameIndex
        return (
          <div
            key={event.sequence || index}
            onClick={() => jumpToFrame(index)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 12px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: isActive ? 'var(--accent-bg-secondary)' : 'transparent',
              color: isActive ? 'var(--accent-secondary)' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: isActive ? 'bold' : 'normal',
            }}
          >
            <span style={{ color: isActive ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
              #{index + 1}
            </span>
            <span>
              {event.className}.{event.methodName}()
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              Line {event.lineNumber}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default ExecutionEventLogPanel
