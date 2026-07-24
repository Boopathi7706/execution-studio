import React, { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { usePlaybackStore } from '../store/usePlaybackStore'
import { useExecuteTrace } from '../hooks/useExecuteTrace'

/**
 * Execution Studio V3 — Professional IDE Toolbar.
 *
 * Buttons: ▶ Run | ⧖ Step | ⟳ Restart | ⚙ Settings
 * Right: Step counter | Trace ID | Backend Health Badge
 *
 * NOTE: "Debug" is intentionally absent — live JDI debugging is not yet implemented.
 * "Step Mode" describes single-step playback instead.
 */
export const Header: React.FC = () => {
  const backendStatus = useAppStore((state) => state.backendStatus)
  const healthInfo = useAppStore((state) => state.healthInfo)
  const isHealthChecking = useAppStore((state) => state.isHealthChecking)
  const checkHealth = useAppStore((state) => state.checkHealth)

  const sessionId = usePlaybackStore((state) => state.sessionId)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const togglePlay = usePlaybackStore((state) => state.togglePlay)
  const restart = usePlaybackStore((state) => state.restart)
  const stepForward = usePlaybackStore((state) => state.stepForward)
  const metadata = usePlaybackStore((state) => state.metadata)
  const isDeveloperMode = usePlaybackStore((state) => state.isDeveloperMode)
  const setIsDeveloperMode = usePlaybackStore((state) => state.setIsDeveloperMode)

  const { isExecuting, stage } = useExecuteTrace()

  const isConnected = connectionStatus === 'CONNECTED'

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  const getStatusBadge = () => {
    if (isHealthChecking && backendStatus === 'unknown') {
      return { label: 'Connecting...', color: '#f59e0b', dotClass: 'connecting' }
    }
    if (backendStatus === 'connected') {
      return {
        label: healthInfo?.application ? 'Ready' : 'Ready',
        color: '#22c55e',
        dotClass: 'connected',
      }
    }
    return { label: 'Offline', color: '#ef4444', dotClass: '' }
  }

  const badge = getStatusBadge()

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  }

  const disabledBtn: React.CSSProperties = {
    ...btnBase,
    opacity: 0.45,
    cursor: 'not-allowed',
  }

  return (
    <header className="app-header">
      {/* ── Left: Brand ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="brand-title">Execution Studio</span>
        <span
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            backgroundColor: 'rgba(147, 51, 234, 0.2)',
            color: '#c084fc',
            border: '1px solid rgba(192, 132, 252, 0.4)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontWeight: '700',
            letterSpacing: '0.6px',
          }}
        >
          JAVA MEMORY ENVIRONMENT
        </span>
      </div>

      {/* ── Center: Playback Toolbar ─────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Compiling indicator while executing */}
        {isExecuting && (
          <span
            style={{
              fontSize: '11px',
              color: '#f59e0b',
              fontFamily: 'var(--font-mono)',
              padding: '4px 10px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              borderRadius: '4px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            ⏳ {stage === 'compiling' ? 'Compiling…' : stage === 'polling' ? 'Running JDI…' : 'Submitting…'}
          </span>
        )}

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          disabled={!isConnected}
          title={isPlaying ? 'Pause playback' : 'Play execution trace'}
          style={isConnected ? {
            ...btnBase,
            backgroundColor: isPlaying ? '#f59e0b' : '#22c55e',
            border: 'none',
            color: '#0f172a',
            fontWeight: '700',
          } : disabledBtn}
        >
          {isPlaying ? '⏸ Pause' : '▶ Run'}
        </button>

        {/* Step Forward */}
        <button
          onClick={() => stepForward().catch(() => {})}
          disabled={!isConnected}
          title="Step forward one execution step"
          style={isConnected ? btnBase : disabledBtn}
        >
          ⧖ Step
        </button>

        {/* Restart */}
        <button
          onClick={() => restart().catch(() => {})}
          disabled={!isConnected}
          title="Restart execution"
          style={isConnected ? btnBase : disabledBtn}
        >
          ⟳ Restart
        </button>

        {/* Developer Mode Toggle */}
        <button
          onClick={() => setIsDeveloperMode(!isDeveloperMode)}
          title={isDeveloperMode ? 'Switch to Educational Mode' : 'Switch to Developer Mode'}
          style={{
            ...btnBase,
            backgroundColor: isDeveloperMode ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            borderColor: isDeveloperMode ? '#38bdf8' : 'var(--border-color)',
            color: isDeveloperMode ? '#38bdf8' : 'var(--text-secondary)',
          }}
        >
          ⚙ {isDeveloperMode ? 'Dev Mode' : 'Dev Mode Off'}
        </button>
      </div>

      {/* ── Right: Session Info & Health ─────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Step Counter */}
        {isConnected && metadata && metadata.totalSteps > 0 && (
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            Step {metadata.currentStepIndex + 1} / {metadata.totalSteps}
          </span>
        )}

        {/* Trace session ID */}
        {sessionId && isConnected && (
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Trace ID:{' '}
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                color: '#94a3b8',
                fontSize: '11px',
              }}
            >
              {sessionId.length > 20 ? sessionId.slice(0, 20) + '…' : sessionId}
            </code>
          </span>
        )}

        {/* Backend health badge */}
        <div className="status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className={`status-dot ${badge.dotClass}`}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: badge.color,
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '12px', color: badge.color, fontWeight: '600' }}>{badge.label}</span>
        </div>
      </div>
    </header>
  )
}

export default Header
