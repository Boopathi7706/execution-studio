import React from 'react'
import { GRAPH_THEME } from './graph.theme'

/**
 * Graph Legend component displaying node type colors and reference edge indicators.
 */
export const GraphLegend: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-tertiary)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: GRAPH_THEME.colors.objectNode,
          }}
        />
        <span>Object Class Node</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '2px',
            backgroundColor: GRAPH_THEME.colors.arrayNode,
          }}
        />
        <span>Array Node</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: GRAPH_THEME.colors.stringNode,
          }}
        />
        <span>String Node</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: GRAPH_THEME.colors.edgeText, fontWeight: 'bold' }}>➔</span>
        <span>Reference Field / Index Edge</span>
      </div>
    </div>
  )
}

export default GraphLegend
