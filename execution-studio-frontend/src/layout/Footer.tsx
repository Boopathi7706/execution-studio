import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'

/**
 * Developer tool status bar footer.
 * Displays timeline counts, shortcuts hints, and active error alerts.
 */
export const Footer: React.FC = () => {
  const metadata = usePlaybackStore((state) => state.metadata)
  const error = usePlaybackStore((state) => state.error)
  const clearError = usePlaybackStore((state) => state.clearError)

  return (
    <footer className="app-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {error ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--accent-error)',
            }}
          >
            <span>⚠️ {error}</span>
            <button
              onClick={clearError}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '11px',
              }}
            >
              Dismiss
            </button>
          </div>
        ) : (
          <span>Ready</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {metadata && (
          <span>
            Step: {metadata.currentStepIndex + 1} / {metadata.totalSteps} (
            {Math.round(metadata.progressPercentage)}%)
          </span>
        )}
        <span>Shortcuts: Space (Play/Pause) • ← / → (Step)</span>
      </div>
    </footer>
  )
}
export default Footer
