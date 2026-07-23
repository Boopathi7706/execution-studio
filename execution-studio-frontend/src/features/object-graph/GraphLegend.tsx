import React from 'react'
import { GRAPH_THEME } from './graph.theme'

/**
 * Educational Data Structure Legend displaying structure type visual indicators.
 */
export const GraphLegend: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        padding: '6px 12px',
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
            borderRadius: '2px',
            backgroundColor: GRAPH_THEME.colors.objectNode,
          }}
        />
        <span>Object Card</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '0px',
            backgroundColor: GRAPH_THEME.colors.arrayNode,
          }}
        />
        <span>Array Cell Box</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '2px',
            backgroundColor: GRAPH_THEME.colors.linkedListNode,
          }}
        />
        <span>Linked List Node</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: GRAPH_THEME.colors.treeNode,
          }}
        />
        <span>Binary Tree Node</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>📌</span>
        <span>Stack Variable Tag</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: GRAPH_THEME.colors.edgeText, fontWeight: 'bold' }}>➔</span>
        <span>Field Pointer Reference</span>
      </div>
    </div>
  )
}

export default GraphLegend
