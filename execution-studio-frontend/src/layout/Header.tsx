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

  const { isExecuting, stage } = useExecuteTrace()

  const isConnected = connectionStatus === 'CONNECTED'

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  const getStatusBadge = () => {
    if (isHealthChecking && backendStatus === 'unknown') {
      return { label: 'Connecting...', color: 'var(--accent-warning)', dotClass: 'connecting' }
    }
    if (backendStatus === 'connected') {
      return {
        label: healthInfo?.application ?? 'Engine Online',
        color: 'var(--accent-success)',
        dotClass: 'connected',
      }
    }
    return { label: 'Offline', color: 'var(--accent-error)', dotClass: '' }
  }

  const badge = getStatusBadge()
  const currentStep = metadata ? metadata.currentStepIndex + 1 : 0
  const totalSteps = metadata ? metadata.totalSteps : 0

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
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
            fontSize: '9px',
            textTransform: 'uppercase',
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent-color)',
            padding: '2px 6px',
            borderRadius: '3px',
            fontWeight: '800',
            letterSpacing: '0.8px',
          }}
        >
          V3
        </span>
      </div>

      {/* ── Center: Playback Toolbar ─────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Compiling indicator while executing */}
        {isExecuting && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--accent-warning)',
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              borderRadius: '3px',
              border: '1px solid rgba(234, 179, 8, 0.3)',
            }}
          >
            ⏳ {stage === 'compiling' ? 'Compiling…' : stage === 'polling' ? 'Running JDI…' : 'Submitting…'}
          </span>
        )}

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          disabled={!isConnected}
          title={isPlaying ? 'Pause playback (Space)' : 'Play execution trace (Space)'}
          style={isConnected ? {
            ...btnBase,
            backgroundColor: isPlaying ? 'var(--accent-warning)' : 'var(--accent-success)',
            border: 'none',
            color: '#0f172a',
            fontWeight: '700',
          } : disabledBtn}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        {/* Step Mode — single step forward */}
        <button
          onClick={() => stepForward().catch(() => {})}
          disabled={!isConnected}
          title="Step forward one execution step (→)"
          style={isConnected ? btnBase : disabledBtn}
        >
          ⧖ Step
        </button>

        {/* Restart */}
        <button
          onClick={() => restart().catch(() => {})}
          disabled={!isConnected}
          title="Restart from step 0 (R)"
          style={isConnected ? btnBase : disabledBtn}
        >
          ⟳ Restart
        </button>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '20px',
            backgroundColor: 'var(--border-color)',
            margin: '0 2px',
          }}
        />

        {/* Settings placeholder */}
        <button
          title="Settings (coming soon)"
          style={{ ...btnBase, color: 'var(--text-muted)' }}
        >
          ⚙
        </button>
      </div>

      {/* ── Right: Session Info & Health ─────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Step counter when connected */}
        {isConnected && totalSteps > 0 && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Step {currentStep} / {totalSteps}
          </span>
        )}

        {/* Trace session ID */}
        {sessionId && isConnected && (
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Trace:{' '}
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-secondary)',
                fontSize: '10px',
              }}
            >
              {sessionId.length > 14 ? sessionId.slice(0, 14) + '…' : sessionId}
            </code>
          </span>
        )}

        {/* Backend health badge */}
        <div className="status-badge">
          <span
            className={`status-dot ${badge.dotClass}`}
            style={{ backgroundColor: badge.color }}
          />
          <span style={{ fontSize: '11px', color: badge.color }}>{badge.label}</span>
        </div>
      </div>
    </header>
  )
}

export default Header
