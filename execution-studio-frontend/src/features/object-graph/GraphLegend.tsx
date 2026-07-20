import React from 'react'

/**
 * Graph Legend component displaying color tags mapping.
 */
export const GraphLegend: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        padding: '6px 12px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-tertiary)',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-color)',
          }}
        />
        <span>Object Class Node</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '2px',
            backgroundColor: '#0ea5e9',
          }}
        />
        <span>Array Node</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: 'var(--text-muted)' }}>➔</span>
        <span>Reference Field Edge</span>
      </div>
    </div>
  )
}

export default GraphLegend
