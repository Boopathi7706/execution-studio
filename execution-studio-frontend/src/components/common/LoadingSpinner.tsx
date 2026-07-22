import React from 'react'

export interface LoadingSpinnerProps {
  label?: string
  size?: number
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 20,
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: '#94a3b8',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: '2px solid rgba(148, 163, 184, 0.2)',
          borderTop: '2px solid #38bdf8',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label && <span>{label}</span>}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner
