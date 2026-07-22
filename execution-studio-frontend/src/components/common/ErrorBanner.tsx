import React from 'react'

export interface ErrorBannerProps {
  message: string
  onClose?: () => void
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        color: '#f87171',
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '13px',
        margin: '8px 16px',
      }}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f87171',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '0 4px',
          }}
          title="Close notification"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default ErrorBanner
