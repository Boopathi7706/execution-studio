import React from 'react'
import type { VariableView } from '@/types/visualization.types'

/**
 * Formats a DisplayValue object into a premium visual debugger string.
 */
function formatVariableValue(variable: VariableView): string {
  const val = variable.value
  if (!val || val.kind === 'null') return 'null'

  const rawVal = val.value ?? val.valueString ?? ''

  // Collections formatting (e.g. ArrayList(size=5) or List size=5)
  if (
    variable.declaredType &&
    (variable.declaredType.includes('List') ||
      variable.declaredType.includes('Set') ||
      variable.declaredType.includes('Map'))
  ) {
    if (rawVal.includes(variable.declaredType)) return rawVal
    if (rawVal.startsWith('size=')) {
      return `${variable.declaredType}(${rawVal})`
    }
    return `${variable.declaredType}(size=${rawVal || '0'})`
  }

  switch (val.kind) {
    case 'primitive':
      return rawVal
    case 'string':
      if (rawVal.startsWith('"') && rawVal.endsWith('"')) return rawVal
      return `"${rawVal}"`
    case 'object_ref':
      if (rawVal.includes('@')) {
        const parts = rawVal.split('@')
        return `${parts[0].trim()} @${parts[1].trim()}`
      }
      return `${variable.declaredType} @${val.objectId || rawVal}`
    case 'array_ref':
      if (rawVal.includes('length=')) return rawVal
      return `${variable.declaredType}`
    default:
      return rawVal || 'null'
  }
}

interface VariableValueProps {
  variable: VariableView
}

export const VariableValue: React.FC<VariableValueProps> = ({ variable }) => {
  const formatted = formatVariableValue(variable)
  const isObject = variable.value?.kind === 'object_ref' || variable.value?.kind === 'array_ref'
  const isNull = variable.value?.kind === 'null'

  let textColor = 'var(--text-primary)'
  if (isNull) textColor = 'var(--text-muted)'
  else if (isObject) textColor = 'var(--accent-secondary)'

  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: textColor,
      }}
    >
      {formatted}
    </span>
  )
}

export default VariableValue
