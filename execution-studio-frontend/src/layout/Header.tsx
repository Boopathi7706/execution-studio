import React, { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { usePlaybackStore } from '../store/usePlaybackStore'

/**
 * Application Header component displaying logo, backend status, and health connection badge.
 */
export const Header: React.FC = () => {
  const backendStatus = useAppStore((state) => state.backendStatus)
  const healthInfo = useAppStore((state) => state.healthInfo)
  const isHealthChecking = useAppStore((state) => state.isHealthChecking)
  const checkHealth = useAppStore((state) => state.checkHealth)

  const sessionId = usePlaybackStore((state) => state.sessionId)

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  const getStatusBadge = () => {
    if (isHealthChecking && backendStatus === 'unknown') {
      return {
        label: 'Checking Backend...',
        color: '#eab308',
        dotClass: 'connecting',
      }
    }
    if (backendStatus === 'connected') {
      return {
        label: healthInfo?.application
          ? `Backend Connected (${healthInfo.application} v${healthInfo.version})`
          : 'Backend Connected',
        color: '#22c55e',
        dotClass: 'connected',
      }
    }
    return {
      label: 'Backend Offline',
      color: '#ef4444',
      dotClass: '',
    }
  }

  const badge = getStatusBadge()

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="brand-title">Execution Studio</span>
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            backgroundColor: 'var(--accent-bg, rgba(56, 189, 248, 0.15))',
            color: 'var(--accent-color, #38bdf8)',
            padding: '2px 6px',
            borderRadius: '3px',
            fontWeight: 'bold',
          }}
        >
          v1.0
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {sessionId && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Session: <code style={{ color: 'var(--text-primary)' }}>{sessionId}</code>
          </span>
        )}
        <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className={`status-dot ${badge.dotClass}`}
            style={{ backgroundColor: badge.color }}
          />
          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{badge.label}</span>
        </div>
      </div>
    </header>
  )
}

export default Header
