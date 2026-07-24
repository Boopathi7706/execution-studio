import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'

/**
 * Pure Program Console Output Panel.
 * Displays ONLY stdout, stderr, and structured compilation diagnostics.
 * Concatenates character stream chunks without inserting synthetic messages.
 */
export const ConsolePanel: React.FC = () => {
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const consoleStream = usePlaybackStore((state) => state.consoleStream)
  const error = usePlaybackStore((state) => state.error)
  const isConnected = connectionStatus === 'CONNECTED'

  const currentLine = currentModel?.highlights?.currentLine || 1
  const currentMethod = currentModel?.highlights?.currentMethod || 'main'
  const compDiags = currentModel?.compilationDiagnostics || []

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
          lineHeight: '1.4',
        }}
      >
        {!isConnected && !error && (
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Console idle. Click ▶ Run to execute Java code and view program output stream.
          </span>
        )}

        {/* Compilation Failure */}
        {error && (
          <div style={{ color: '#ef4444', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 'bold' }}>[Compilation Error]</span>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              {error}
            </pre>
          </div>
        )}

        {compDiags.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            {compDiags.map((d, i) => (
              <div key={i} style={{ color: d.severity === 'ERROR' ? '#ef4444' : '#f59e0b', fontSize: '11px' }}>
                <span style={{ fontWeight: 'bold' }}>[{d.severity}]</span> {d.file}:{d.line}:{d.column} - {d.message}
              </div>
            ))}
          </div>
        )}

        {/* Pure Output Stream Chunks (Concatenated naturally) */}
        {consoleStream && consoleStream.length > 0 && (
          <pre
            style={{
              margin: 0,
              padding: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {consoleStream.map((entry, idx) => (
              <span
                key={idx}
                style={{
                  color: entry.type === 'stderr' ? '#ef4444' : '#f8fafc',
                }}
              >
                {entry.text}
              </span>
            ))}
          </pre>
        )}
      </div>
    </div>
  )
}

export default ConsolePanel
