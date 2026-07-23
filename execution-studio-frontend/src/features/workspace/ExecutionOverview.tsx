import React from 'react'
import { useAppStore } from '@/store/useAppStore'
import { usePlaybackStore } from '@/store/usePlaybackStore'

interface ExecutionOverviewProps {
  onRunCode?: () => void
}

/**
 * Execution Overview Landing Component.
 * Provides backend health status, detected class metadata, execution state summary, and quick start guidance.
 */
export const ExecutionOverview: React.FC<ExecutionOverviewProps> = ({ onRunCode }) => {
  const backendStatus = useAppStore((state) => state.backendStatus)
  const healthInfo = useAppStore((state) => state.healthInfo)

  const sessionId = usePlaybackStore((state) => state.sessionId)
  const status = usePlaybackStore((state) => state.status)
  const timeline = usePlaybackStore((state) => state.timeline)
  const totalFrameCount = usePlaybackStore((state) => state.totalFrameCount)

  const isConnected = backendStatus === 'connected'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--bg-secondary)',
        padding: '24px',
        overflowY: 'auto',
        gap: '20px',
      }}
      className="execution-overview"
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Execution Studio Overview
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isConnected ? 'var(--accent-success)' : 'var(--accent-error)',
              fontWeight: 'bold',
              border: `1px solid ${isConnected ? 'var(--accent-success)' : 'var(--accent-error)'}`,
            }}
          >
            {isConnected ? 'Backend Online' : 'Backend Offline'}
          </span>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Interactive Java Debug Interface (JDI) execution visualizer & memory inspector.
        </span>
      </div>

      {/* Overview Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: Backend Engine */}
        <div
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>
            Backend System
          </span>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {healthInfo?.application || 'Execution Studio API'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Version: {healthInfo?.version || '1.0.0'} (Java 21 / Spring Boot)
          </span>
        </div>

        {/* Card 2: Active Session */}
        <div
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>
            Active Session
          </span>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>
            {sessionId ? `@${sessionId}` : 'Ready to Run'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Status: {status || 'IDLE'}
          </span>
        </div>

        {/* Card 3: Execution Metrics */}
        <div
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>
            Recorded Frames
          </span>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
            {totalFrameCount > 0 ? `${totalFrameCount} timeline steps` : '0 steps captured'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Timeline: {timeline.length > 0 ? 'Loaded' : 'Awaiting code execution'}
          </span>
        </div>
      </div>

      {/* Getting Started Callout */}
      <div
        style={{
          backgroundColor: 'rgba(168, 85, 247, 0.08)',
          border: '1px solid var(--accent-color)',
          borderRadius: '6px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
          🚀 Getting Started Instruction
        </span>
        <ol style={{ fontSize: '12px', color: 'var(--text-primary)', paddingLeft: '20px', lineHeight: '1.6' }}>
          <li>Write or modify Java source code in the left <strong>Java Source Code Editor</strong>.</li>
          <li>Click the <strong>▶ Run Code</strong> button or press the execution action.</li>
          <li>The backend will compile your program, launch an isolated JVM, and capture line events using JDI.</li>
          <li>Once execution completes, the interactive <strong>Object Reference Graph</strong>, <strong>Local Variables</strong>, and <strong>Heap Cards</strong> will automatically reveal!</li>
        </ol>

        {onRunCode && (
          <button
            onClick={onRunCode}
            style={{
              alignSelf: 'flex-start',
              marginTop: '6px',
              backgroundColor: 'var(--accent-color)',
              color: '#0f172a',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ▶ Run Sample Program Now
          </button>
        )}
      </div>
    </div>
  )
}

export default ExecutionOverview
