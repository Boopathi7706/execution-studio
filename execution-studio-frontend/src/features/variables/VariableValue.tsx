import React from 'react'
import type { VariableView } from '@/types/visualization.types'

/**
 * Formats a DisplayValue object into a clean visual debugger representation.
 * Handles int, long, short, byte, float, double, boolean, char, string, null, object_ref, array_ref.
 * Never calls string methods on primitive numbers or booleans.
 */
export function formatVariableValue(variable: VariableView): string {
  const val = variable.value
  if (!val || val.kind === 'null') return 'null'

  const kind = val.kind
  const rawVal = val.value !== undefined ? val.value : val.valueString

  switch (kind) {
    case 'int':
    case 'long':
    case 'short':
    case 'byte':
    case 'float':
    case 'double':
    case 'primitive':
      return rawVal !== undefined && rawVal !== null ? String(rawVal) : '0'

    case 'boolean':
      return String(Boolean(rawVal))

    case 'char': {
      const charStr = String(rawVal ?? '')
      if (charStr.startsWith("'") && charStr.endsWith("'")) return charStr
      return `'${charStr}'`
    }

    case 'string': {
      const str = String(rawVal ?? '')
      if (str.startsWith('"') && str.endsWith('"')) return str
      return `"${str}"`
    }

    case 'object_ref': {
      const refId = val.objectId || (typeof rawVal === 'string' ? rawVal : '')
      if (refId) {
        if (refId.startsWith('@')) return refId
        return `@${refId}`
      }
      return `${variable.declaredType || 'Object'}@ref`
    }

    case 'array_ref': {
      const refId = val.objectId || (typeof rawVal === 'string' ? rawVal : '')
      if (refId) {
        if (refId.startsWith('@')) return refId
        return `@${refId}`
      }
      return `${variable.declaredType || 'Array'}@ref`
    }

    case 'null':
      return 'null'

    default:
      if (rawVal !== undefined && rawVal !== null) {
        return String(rawVal)
      }
      return 'null'
  }
}

interface VariableValueProps {
  variable: VariableView
}

export const VariableValue: React.FC<VariableValueProps> = ({ variable }) => {
  const formatted = formatVariableValue(variable)
  const kind = variable.value?.kind
  const isObject = kind === 'object_ref' || kind === 'array_ref'
  const isNull = kind === 'null'

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
