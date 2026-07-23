import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import FrameCard from './FrameCard'

/**
 * Call Stack panel.
 * Visualizes the currently active JDI thread stack frames, highlighting the executing method.
 */
export const CallStackPanel: React.FC = () => {
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const selectedFrameIndex = usePlaybackStore((state) => state.selectedFrameIndex)
  const setSelectedFrameIndex = usePlaybackStore((state) => state.setSelectedFrameIndex)

  const isConnected = connectionStatus === 'CONNECTED'
  const frames = isConnected && currentModel?.stack ? currentModel.stack.frames : []

  if (!isConnected || frames.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontStyle: 'italic',
        }}
        className="call-stack-empty"
      >
        No active execution stack
      </div>
    )
  }

  return (
    <div
      tabIndex={0}
      aria-label="Call Stack Frames List"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-secondary)',
      }}
      className="call-stack-list"
    >
      {frames.map((frame, index) => {
        // Frame depth is displayed relative to bottom of stack (main = #0)
        const depth = frames.length - 1 - index
        // Highlight active frame based on selection or top-frame fallback
        const isHighlighted =
          selectedFrameIndex !== null ? selectedFrameIndex === index : index === 0 || frame.isActive

        return (
          <FrameCard
            key={`${frame.className}-${frame.methodName}-${index}`}
            frame={frame}
            isActive={isHighlighted}
            depth={depth}
            onClick={() => setSelectedFrameIndex(index)}
          />
        )
      })}
    </div>
  )
}

export default CallStackPanel
