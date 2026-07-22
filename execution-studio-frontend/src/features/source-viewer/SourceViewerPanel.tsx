import React, { useState } from 'react'
import MonacoWrapper from './MonacoWrapper'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import { useExecuteTrace } from '@/hooks/useExecuteTrace'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const DEFAULT_JAVA_CODE = `public class Test {
    public static void main(String[] args) {
        int a = 5;
        int b = 10;
        int c = a + b;
        System.out.println(c);
    }
}`

/**
 * Source Code Viewer Panel with integrated Run Code execution trigger and active line highlighting.
 */
export const SourceViewerPanel: React.FC = () => {
  const [sourceCode, setSourceCode] = useState<string>(DEFAULT_JAVA_CODE)
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const currentFrameIndex = usePlaybackStore((state) => state.currentFrameIndex)
  const timeline = usePlaybackStore((state) => state.timeline)

  const { stage, errorMessage, runCode, isExecuting } = useExecuteTrace()

  const isConnected = connectionStatus === 'CONNECTED'
  const currentFrame = timeline[currentFrameIndex]

  const currentLine = isConnected && currentModel?.highlights?.currentLine
    ? currentModel.highlights.currentLine
    : currentFrame
    ? currentFrame.lineNumber
    : 0

  const handleRun = () => {
    runCode(sourceCode)
  }

  const getStageBadge = () => {
    switch (stage) {
      case 'submitting':
        return { label: 'Submitting source...', color: '#eab308' }
      case 'compiling':
      case 'polling':
        return { label: 'Compiling & Running JDI...', color: '#38bdf8' }
      case 'completed':
        return { label: 'Execution completed', color: '#22c55e' }
      case 'failed':
        return { label: errorMessage || 'Execution failed', color: '#ef4444' }
      default:
        return null
    }
  }

  const badge = getStageBadge()

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar with Run Code button and stage badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Java Source Editor</span>
          {badge && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: `${badge.color}22`,
                color: badge.color,
                border: `1px solid ${badge.color}44`,
                fontWeight: 'bold',
              }}
            >
              {badge.label}
            </span>
          )}
        </div>

        <button
          onClick={handleRun}
          disabled={isExecuting}
          style={{
            backgroundColor: isExecuting ? '#334155' : '#22c55e',
            color: isExecuting ? '#94a3b8' : '#0f172a',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isExecuting ? <LoadingSpinner label="Running..." size={14} /> : '▶ Run Code'}
        </button>
      </div>

      {/* Editor Body */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MonacoWrapper
          sourceCode={sourceCode}
          onChange={setSourceCode}
          currentLine={currentLine}
          theme="vs-dark"
          readOnly={false}
        />
      </div>
    </div>
  )
}

export default SourceViewerPanel
