import React, { useEffect, useCallback } from 'react'
import { usePlaybackStore, type TraceEvent } from '@/store/usePlaybackStore'

/**
 * Timeline Controls & Event Navigator Panel.
 * Supports both legacy WebSocket/Rest playback session state and new trace execution playback.
 */
export const TimelinePanel: React.FC = () => {
  const metadata = usePlaybackStore((state) => state.metadata)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const playSpeed = usePlaybackStore((state) => state.playSpeed)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const timeline = usePlaybackStore((state) => state.timeline)
  const currentFrameIndex = usePlaybackStore((state) => state.currentFrameIndex)

  const stepForward = usePlaybackStore((state) => state.stepForward)
  const stepBackward = usePlaybackStore((state) => state.stepBackward)
  const seek = usePlaybackStore((state) => state.seek)
  const togglePlay = usePlaybackStore((state) => state.togglePlay)
  const setSpeed = usePlaybackStore((state) => state.setSpeed)
  const restart = usePlaybackStore((state) => state.restart)
  const firstFrame = usePlaybackStore((state) => state.firstFrame)
  const lastFrame = usePlaybackStore((state) => state.lastFrame)
  const stop = usePlaybackStore((state) => state.stop)
  const jumpToFrame = usePlaybackStore((state) => state.jumpToFrame)

  const isConnected = connectionStatus === 'CONNECTED'
  const currentStep = metadata ? metadata.currentStepIndex : 0
  const totalSteps = metadata ? metadata.totalSteps : 0
  const progressPercent = metadata ? metadata.progressPercentage : 0

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
      const isMonacoEditor = !!(
        target &&
        (target.closest?.('.monaco-editor') ||
          target.closest?.('.monaco-component') ||
          target.classList?.contains('inputarea') ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      )
      if (isMonacoEditor) {
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

  const buttonStyle = (enabled: boolean): React.CSSProperties => ({
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: enabled ? 'var(--text-primary)' : 'var(--text-muted)',
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    minWidth: '32px',
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
      }}
    >
      {/* Top Controls & Player Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: 'var(--bg-primary)',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={firstFrame}
            disabled={!isConnected}
            style={buttonStyle(isConnected)}
            title="First Frame (Home)"
            aria-label="First Frame"
          >
            ⏮ First
          </button>
          <button
            onClick={handleRestart}
            disabled={!isConnected}
            style={buttonStyle(isConnected)}
            title="Restart (R)"
            aria-label="Restart"
          >
            ↺ Restart
          </button>
          <button
            onClick={handleStepBackward}
            disabled={!isConnected}
            style={buttonStyle(isConnected)}
            title="Step Backward (Left Arrow)"
            aria-label="Step Backward"
          >
            ◀ Prev
          </button>
          <button
            onClick={togglePlay}
            disabled={!isConnected}
            style={{
              ...buttonStyle(isConnected),
              backgroundColor: isPlaying ? 'var(--accent-secondary)' : 'var(--bg-tertiary)',
              color: isPlaying ? '#0f172a' : 'var(--text-primary)',
            }}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={stop}
            disabled={!isConnected}
            style={buttonStyle(isConnected)}
            title="Stop (Reset to Frame 0)"
            aria-label="Stop"
          >
            ⏹ Stop
          </button>
          <button
            onClick={handleStepForward}
            disabled={!isConnected}
            style={buttonStyle(isConnected)}
            title="Step Forward (Right Arrow)"
            aria-label="Step Forward"
          >
            Next ▶
          </button>
          <button
            onClick={lastFrame}
            disabled={!isConnected}
            style={buttonStyle(isConnected)}
            title="Last Frame (End)"
            aria-label="Last Frame"
          >
            Last ⏭
          </button>
        </div>

        {/* Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }} htmlFor="playback-speed-select">
            Speed:
          </label>
          <select
            id="playback-speed-select"
            value={playSpeed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            disabled={!isConnected}
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: isConnected ? 'var(--text-primary)' : 'var(--text-muted)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '12px',
              outline: 'none',
              cursor: isConnected ? 'pointer' : 'not-allowed',
            }}
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1.0}>1.0x</option>
            <option value={2.0}>2.0x</option>
            <option value={5.0}>5.0x</option>
          </select>
        </div>
      </div>

      {/* Scrubber Range Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
            accentColor: 'var(--accent-secondary)',
          }}
          aria-label="Timeline scrubber"
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span>
            {isConnected
              ? `Step ${currentStep + 1} / ${totalSteps}`
              : 'No Active Session'}
          </span>
          {isConnected && <span>{Math.round(progressPercent)}%</span>}
        </div>
      </div>

      {/* Timeline Frames Thumbnails List */}
      {timeline.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '2px 0',
          }}
        >
          {timeline.map((event: TraceEvent, index: number) => {
            const isActive = index === currentFrameIndex
            return (
              <button
                key={event.sequence || index}
                onClick={() => jumpToFrame(index)}
                style={{
                  flexShrink: 0,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: isActive ? '1px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--accent-bg-secondary)' : 'var(--bg-primary)',
                  color: isActive ? 'var(--accent-secondary)' : 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span style={{ fontWeight: 'bold' }}>#{index + 1}</span>
                <span>
                  {event.className}.{event.methodName}()
                </span>
                <span style={{ color: 'var(--text-muted)' }}>Line {event.lineNumber}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TimelinePanel
