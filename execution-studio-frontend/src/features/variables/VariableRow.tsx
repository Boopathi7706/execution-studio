import React, { useState, useEffect } from 'react'
import type { VariableView } from '@/types/visualization.types'
import VariableValue from './VariableValue'

interface VariableRowProps {
  variable: VariableView
}

/**
 * A memoized table row representing a single Java variable.
 * Automatically flashes its background when variable.changed is marked true.
 */
export const VariableRow: React.FC<VariableRowProps> = React.memo(({ variable }) => {
  const [isFlashing, setIsFlashing] = useState(false)

  useEffect(() => {
    if (variable.changed) {
      setIsFlashing(true)
      const timer = setTimeout(() => {
        setIsFlashing(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [variable.value, variable.changed])

  return (
    <tr
      className={isFlashing ? 'variable-row-flash' : ''}
      style={{
        borderBottom: '1px solid var(--border-color)',
        transition: 'background-color 0.8s ease-out',
      }}
    >
      <td
        style={{
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text-primary)',
        }}
      >
        {variable.name}
      </td>
      <td
        style={{
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        {variable.declaredType}
      </td>
      <td
        style={{
          padding: '8px 12px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          textTransform: 'lowercase',
        }}
      >
        {variable.scope}
      </td>
      <td style={{ padding: '8px 12px' }}>
        <VariableValue variable={variable} />
      </td>
    </tr>
  )
})

VariableRow.displayName = 'VariableRow'
export default VariableRow
