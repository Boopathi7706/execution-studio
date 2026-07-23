import React, { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { usePlaybackStore } from '../store/usePlaybackStore'
import ViewMenuDropdown from '../components/ViewMenuDropdown'

/**
 * Professional IDE Toolbar & Header component.
 * Displays logo, session state, backend connection health status, and View & Presets Menu.
 */
export const Header: React.FC = () => {
  const backendStatus = useAppStore((state) => state.backendStatus)
  const healthInfo = useAppStore((state) => state.healthInfo)
  const isHealthChecking = useAppStore((state) => state.isHealthChecking)
  const checkHealth = useAppStore((state) => state.checkHealth)

  const sessionId = usePlaybackStore((state) => state.sessionId)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  const getStatusBadge = () => {
    if (isHealthChecking && backendStatus === 'unknown') {
      return {
        label: 'Checking Backend...',
        color: 'var(--accent-warning)',
        dotClass: 'connecting',
      }
    }
    if (backendStatus === 'connected') {
      return {
        label: healthInfo?.application
          ? `Connected (${healthInfo.application})`
          : 'Backend Connected',
        color: 'var(--accent-success)',
        dotClass: 'connected',
      }
    }
    return {
      label: 'Backend Offline',
      color: 'var(--accent-error)',
      dotClass: '',
    }
  }

  const badge = getStatusBadge()

  return (
    <header className="app-header">
      {/* Left Brand Title & Version */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="brand-title">Execution Studio</span>
        <span
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent-color)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
          }}
        >
          v2.0 IDE
        </span>
      </div>

      {/* Right Actions: Session, Health Badge, View Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {sessionId && connectionStatus === 'CONNECTED' && (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Session: <code style={{ color: 'var(--accent-secondary)' }}>{sessionId}</code>
          </span>
        )}

        <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className={`status-dot ${badge.dotClass}`}
            style={{ backgroundColor: badge.color }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{badge.label}</span>
        </div>

        {/* VS Code Style View Menu & Presets Dropdown */}
        <ViewMenuDropdown />
      </div>
    </header>
  )
}

export default Header
