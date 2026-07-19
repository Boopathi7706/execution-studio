import React, { useEffect, useCallback } from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'

/**
 * Premium developer-tool style Timeline Controls panel.
 * Connects directly to Zustand usePlaybackStore for state updates.
 */
export const TimelinePanel: React.FC = () => {
  // Select state values with Zustand selector for optimal performance
  const metadata = usePlaybackStore((state) => state.metadata)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const playSpeed = usePlaybackStore((state) => state.playSpeed)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)

  const stepForward = usePlaybackStore((state) => state.stepForward)
  const stepBackward = usePlaybackStore((state) => state.stepBackward)
  const seek = usePlaybackStore((state) => state.seek)
  const togglePlay = usePlaybackStore((state) => state.togglePlay)
  const setSpeed = usePlaybackStore((state) => state.setSpeed)
  const restart = usePlaybackStore((state) => state.restart)

  const isConnected = connectionStatus === 'CONNECTED'
  const currentStep = metadata ? metadata.currentStepIndex : 0
  const totalSteps = metadata ? metadata.totalSteps : 0
  const progressPercent = metadata ? metadata.progressPercentage : 0

  // Constrain index safely
  const handleSeek = useCallback(
    async (index: number) => {
      if (!isConnected || !metadata) return
      const clampedIndex = Math.max(0, Math.min(metadata.totalSteps - 1, index))
      try {
        await seek(clampedIndex)
      } catch (err: unknown) {
        console.error('Seek error:', err)
      }
    },
    [isConnected, metadata, seek],
  )

  const handleStepForward = useCallback(async () => {
    if (!isConnected) return
    try {
      await stepForward()
    } catch (err: unknown) {
      console.error('Step forward error:', err)
    }
  }, [isConnected, stepForward])

  const handleStepBackward = useCallback(async () => {
    if (!isConnected) return
    try {
      await stepBackward()
    } catch (err: unknown) {
      console.error('Step backward error:', err)
    }
  }, [isConnected, stepBackward])

  const handleRestart = useCallback(async () => {
    if (!isConnected) return
    try {
      await restart()
    } catch (err: unknown) {
      console.error('Restart error:', err)
    }
  }, [isConnected, restart])

  // Setup Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }

      if (connectionStatus !== 'CONNECTED') return

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          stepForward().catch(() => {})
          break
        case 'ArrowLeft':
          e.preventDefault()
          stepBackward().catch(() => {})
          break
        case ' ': // Spacebar
          e.preventDefault()
          togglePlay()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          restart().catch(() => {})
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [connectionStatus, stepForward, stepBackward, togglePlay, restart])

  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: isConnected ? 'var(--text-primary)' : 'var(--text-muted)',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: isConnected ? 'pointer' : 'not-allowed',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'all var(--transition-fast)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    minWidth: '36px',
  }

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'var(--accent-color)',
    borderColor: 'var(--accent-color)',
    color: '#fff',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
      }}
    >
      {/* Control Buttons Group */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRestart}
            disabled={!isConnected}
            style={buttonStyle}
            title="Restart (R)"
            aria-label="Restart"
          >
            ⏮
          </button>
          <button
            onClick={handleStepBackward}
            disabled={!isConnected}
            style={buttonStyle}
            title="Step Backward (Left Arrow)"
            aria-label="Step Backward"
          >
            ◀
          </button>
          <button
            onClick={togglePlay}
            disabled={!isConnected}
            style={isPlaying ? activeButtonStyle : buttonStyle}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={handleStepForward}
            disabled={!isConnected}
            style={buttonStyle}
            title="Step Forward (Right Arrow)"
            aria-label="Step Forward"
          >
            ▶
          </button>
        </div>

        {/* Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label
            style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
            htmlFor="speed-select"
          >
            Speed:
          </label>
          <select
            id="speed-select"
            value={playSpeed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            disabled={!isConnected}
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: isConnected ? 'var(--text-primary)' : 'var(--text-muted)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              outline: 'none',
              cursor: isConnected ? 'pointer' : 'not-allowed',
            }}
          >
            <option value={0.5}>0.5x</option>
            <option value={1.0}>1.0x</option>
            <option value={2.0}>2.0x</option>
            <option value={5.0}>5.0x</option>
          </select>
        </div>
      </div>

      {/* Slider Progress Group */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
          type="range"
          min={0}
          max={totalSteps > 0 ? totalSteps - 1 : 0}
          value={currentStep}
          onChange={(e) => handleSeek(Number(e.target.value))}
          disabled={!isConnected}
          style={{
            width: '100%',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            accentColor: 'var(--accent-color)',
          }}
          aria-label="Timeline scrubber"
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <span>
            {isConnected ? `Step ${currentStep + 1} / ${totalSteps}` : 'No Active Session'}
          </span>
          {isConnected && <span>{Math.round(progressPercent)}%</span>}
        </div>
      </div>
    </div>
  )
}

export default TimelinePanel
