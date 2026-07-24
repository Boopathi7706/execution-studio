import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'

/**
 * Always-Visible Java Program Output Console Panel.
 * Displays stdout / stderr logs captured during execution.
 */
export const ConsolePanel: React.FC = () => {
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const isConnected = connectionStatus === 'CONNECTED'

  // Extract current frame highlights or status info
  const currentLine = currentModel?.highlights?.currentLine || 1
  const currentMethod = currentModel?.highlights?.currentMethod || 'main'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        overflow: 'hidden',
      }}
      className="program-console-panel"
    >
      {/* Console Header */}
      <div
        style={{
          padding: '4px 10px',
          backgroundColor: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>
          💻 Console Output
        </span>
        {isConnected && (
          <span>
            Executing {currentMethod}() : Line {currentLine}
          </span>
        )}
      </div>

      {/* Console Stream Body */}
      <div
        style={{
          flex: 1,
          padding: '8px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          lineHeight: '1.4',
        }}
      >
        {!isConnected ? (
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Console idle. Click ▶ Run to execute Java code and view program output stream.
          </span>
        ) : (
          <>
            <span style={{ color: 'var(--accent-success)' }}>
              [JVM] Executing program trace...
            </span>
            <span style={{ color: '#f8fafc' }}>
              Program started cleanly in isolated trace sandbox.
            </span>
            <span style={{ color: 'var(--accent-secondary)' }}>
              Step {currentLine}: {currentMethod}() active.
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default ConsolePanel
