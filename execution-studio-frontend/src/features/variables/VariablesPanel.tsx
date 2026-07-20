import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { VariableView, VisualizationModel } from '@/types/visualization.types'
import VariableRow from './VariableRow'

/**
 * Resolves active variables safely from current selected stack frame or active frame fallback.
 */
const getActiveVariables = (
  model: VisualizationModel | null,
  selectedFrameIndex: number | null,
): VariableView[] => {
  if (!model) return []
  const frames = model.stack?.frames || []

  const frame =
    selectedFrameIndex !== null && selectedFrameIndex >= 0 && selectedFrameIndex < frames.length
      ? frames[selectedFrameIndex]
      : frames.find((f) => f.isActive) || frames[0]

  if (frame) {
    if (frame.locals) return frame.locals
    // Fallback for typing schemas in mock tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((frame as any).variables) return (frame as any).variables
  }
  if (model.variables?.variables) return model.variables.variables
  return []
}

/**
 * Variables Panel.
 * Renders a debugger-style variables table showing names, types, scopes, and values.
 */
export const VariablesPanel: React.FC = () => {
  const currentModel = usePlaybackStore((state) => state.currentModel)
  const connectionStatus = usePlaybackStore((state) => state.connectionStatus)
  const selectedFrameIndex = usePlaybackStore((state) => state.selectedFrameIndex)

  const isConnected = connectionStatus === 'CONNECTED'
  const variables = isConnected ? getActiveVariables(currentModel, selectedFrameIndex) : []

  if (!isConnected || variables.length === 0) {
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
        className="variables-empty"
      >
        No variables available.
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-secondary)',
      }}
      className="variables-panel"
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)',
              textAlign: 'left',
              color: 'var(--text-muted)',
              fontWeight: 'bold',
            }}
          >
            <th style={{ padding: '8px 12px' }}>Name</th>
            <th style={{ padding: '8px 12px' }}>Type</th>
            <th style={{ padding: '8px 12px' }}>Scope</th>
            <th style={{ padding: '8px 12px' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((variable) => (
            <VariableRow key={variable.name} variable={variable} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default VariablesPanel
