import React, { useState, useEffect } from 'react'
import type { VariableView } from '@/types/visualization.types'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import VariableValue from './VariableValue'

interface VariableRowProps {
  variable: VariableView
}

/**
 * A memoized table row representing a single Java variable.
 * Automatically flashes its background when variable.changed is marked true.
 * Integrates object reference highlighting and synchronized selection store hooks.
 */
export const VariableRow: React.FC<VariableRowProps> = React.memo(({ variable }) => {
  const [isFlashing, setIsFlashing] = useState(false)

  const selectedObjectId = usePlaybackStore((state) => state.selectedObjectId)
  const setSelectedObjectId = usePlaybackStore((state) => state.setSelectedObjectId)

  const isRef = variable.value?.kind === 'object_ref' || variable.value?.kind === 'array_ref'
  const refId = variable.value?.objectId || variable.value?.value || variable.value?.valueString
  const hasRefId = !!(isRef && refId && refId !== 'null' && refId !== '0x0000')
  const isSelected = hasRefId && refId === selectedObjectId

  useEffect(() => {
    if (variable.changed) {
      setIsFlashing(true)
      const timer = setTimeout(() => {
        setIsFlashing(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [variable.value, variable.changed])

  const handleRowClick = () => {
    if (hasRefId && refId) {
      // Toggle selection: click again to clear
      if (isSelected) {
        setSelectedObjectId(null)
      } else {
        setSelectedObjectId(refId)
      }
    }
  }

  return (
    <tr
      className={isFlashing ? 'variable-row-flash' : ''}
      onClick={handleRowClick}
      style={{
        borderBottom: '1px solid var(--border-color)',
        transition: 'background-color 0.8s ease-out',
        cursor: hasRefId ? 'pointer' : 'default',
        backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
      }}
      aria-selected={isSelected}
    >
      <td
        style={{
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: isSelected ? 'var(--accent-secondary)' : 'var(--text-primary)',
          fontWeight: isSelected ? 'bold' : 'normal',
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
