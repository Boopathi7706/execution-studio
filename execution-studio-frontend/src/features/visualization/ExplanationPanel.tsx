import React, { useEffect, useRef } from 'react'

interface ExplanationPanelProps {
  text: string
}

/**
 * Explanation Panel — shows one human-readable sentence per execution step.
 * Animates on each new step to draw the student's attention.
 * Positioned below the Memory Visualization Canvas within the right panel.
 */
export const ExplanationPanel: React.FC<ExplanationPanelProps> = React.memo(({ text }) => {
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (spanRef.current && text) {
      const el = spanRef.current
      el.classList.remove('es-anim-explanation-in')
      void el.offsetWidth
      el.classList.add('es-anim-explanation-in')
    }
  }, [text])

  if (!text) return null

  return (
    <div
      style={{
        padding: '8px 14px',
        backgroundColor: 'rgba(56, 189, 248, 0.06)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        flexShrink: 0,
      }}
      aria-live="polite"
      aria-label="Execution step explanation"
      className="explanation-panel"
    >
      <span
        style={{
          fontSize: '13px',
          flexShrink: 0,
          marginTop: '1px',
        }}
        aria-hidden="true"
      >
        📖
      </span>
      <span
        ref={spanRef}
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          fontStyle: 'italic',
        }}
        className="es-anim-explanation-in"
      >
        {text}
      </span>
    </div>
  )
})

ExplanationPanel.displayName = 'ExplanationPanel'

export default ExplanationPanel
