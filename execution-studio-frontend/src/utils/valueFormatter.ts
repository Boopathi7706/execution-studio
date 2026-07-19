import type { DisplayValue } from '@/types/visualization.types'

/**
 * Formats a DisplayValue object into a standard string representation.
 */
export function formatDisplayValue(val: DisplayValue | null | undefined): string {
  if (!val) return 'null'
  switch (val.kind) {
    case 'primitive':
      return val.valueString || ''
    case 'object_ref':
      return `ref(${val.objectId})`
    case 'array_ref':
      return `ref(${val.objectId})`
    case 'string':
      return `"${val.value}"`
    case 'null':
      return 'null'
    default:
      return 'unknown'
  }
}
