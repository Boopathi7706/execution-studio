import React from 'react'

export interface PanelPlaceholderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export const PanelPlaceholder: React.FC<PanelPlaceholderProps> = ({
  title,
  description = 'Panel ready',
  children,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #334155',
          fontSize: '12px',
          fontWeight: 600,
          color: '#cbd5e1',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          flex: 1,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '13px',
        }}
      >
        {children || <span>{description}</span>}
      </div>
    </div>
  )
}

export default PanelPlaceholder
