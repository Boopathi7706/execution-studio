import React from 'react'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { VariableView, VisualizationModel } from '@/types/visualization.types'
import VariableRow from './VariableRow'

/**
 * Resolves active variables safely from current stack frame or global mapper.
 */
const getActiveVariables = (model: VisualizationModel | null): VariableView[] => {
  if (!model) return []
  const activeFrame = model.stack?.frames?.find((f) => f.isActive) || model.stack?.frames?.[0]
  if (activeFrame) {
    if (activeFrame.locals) return activeFrame.locals
    // Fallback for typing schemas in mock tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((activeFrame as any).variables) return (activeFrame as any).variables
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

  const isConnected = connectionStatus === 'CONNECTED'
  const variables = isConnected ? getActiveVariables(currentModel) : []

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
      className="variables-list"
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--border-color)',
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--bg-tertiary)',
              zIndex: 1,
            }}
          >
            <th
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Name
            </th>
            <th
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Type
            </th>
            <th
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Scope
            </th>
            <th
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {variables.map((variable, index) => (
            <VariableRow key={`${variable.name}-${index}`} variable={variable} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default VariablesPanel
