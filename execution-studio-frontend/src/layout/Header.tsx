import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'

/**
 * Premium developer tool application header.
 * Displays logo, active session indicators, and connection status badges.
 */
export const Header: React.FC = () => {
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const sessionId = usePlaybackStore((state) => state.sessionId)

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return 'connected'
      case 'CONNECTING':
        return 'connecting'
      default:
        return ''
    }
  }

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="brand-title">Execution Studio</span>
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent-color)',
            padding: '2px 6px',
            borderRadius: '3px',
            fontWeight: 'bold',
          }}
        >
          Spike 04
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {sessionId && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Session: <code style={{ color: 'var(--text-primary)' }}>{sessionId}</code>
          </span>
        )}
        <div className="status-badge">
          <span className={`status-dot ${getStatusColor()}`} />
          <span style={{ textTransform: 'capitalize' }}>{connectionStatus.toLowerCase()}</span>
        </div>
      </div>
    </header>
  )
}
export default Header
