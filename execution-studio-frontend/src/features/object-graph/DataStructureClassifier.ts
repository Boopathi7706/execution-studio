import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'
import type { GraphNodeType } from './GraphNode'

/**
 * Checks if a field's value is a reference or null reference (not a primitive int/string/boolean).
 */
function isReferenceField(val?: DisplayValue): boolean {
  if (!val) return false
  if (val.kind === 'null' || val.value === 'null' || val.valueString === 'null') return true
  if (val.kind === 'object_ref' || val.kind === 'array_ref') return true
  if (val.objectId || (typeof val.value === 'string' && val.value.startsWith('obj_'))) return true
  return false
}

/**
 * Checks if a field name matches a structural pointer name (e.g. 'next', 'prev', 'left', 'right')
 * and its value is actually an object reference or null.
 */
function isStructuralRef(fieldName: string, targetName: 'next' | 'prev' | 'left' | 'right', val?: DisplayValue): boolean {
  const lower = fieldName.toLowerCase()
  const matchesName =
    lower === targetName ||
    lower === `${targetName}node` ||
    lower === `${targetName}_node` ||
    lower === `${targetName}child` ||
    lower === `${targetName}_child` ||
    lower.endsWith(`_${targetName}`) ||
    lower.endsWith(targetName)

  return matchesName && isReferenceField(val)
}

/**
 * Intelligent Data Structure Classifier for Educational Memory Visualization.
 * Classifies objects into specialized data structure node types:
 * - ARRAY: Indexed sequential element blocks
 * - LINKED_LIST: Node chains (data | next)
 * - BINARY_TREE: Hierarchical tree nodes (val, left, right)
 * - STACK: Vertical stack items
 * - QUEUE: Linear queue elements
 * - STRING: String objects
 * - OBJECT: General memory cards displaying Class Name & Primary Data
 */
export class DataStructureClassifier {
  static classify(obj: HeapObjectView): { type: GraphNodeType; summary: string } {
    if (!obj) return { type: 'OBJECT', summary: '' }

    const typeStr = obj.classNameOrType || ''
    const fields = obj.fieldsOrElements || {}
    const fieldNames = Object.keys(fields)

    // 1. Strings
    if (typeStr === 'java.lang.String' || typeStr === 'String') {
      const val = fields.value?.value || fields.value?.valueString || ''
      return { type: 'STRING', summary: `"${val}"` }
    }

    // 2. Arrays
    if (obj.type === 'array' || typeStr.includes('[]') || typeStr.endsWith('[]')) {
      const elemCount = fieldNames.length
      const sampleElems = fieldNames
        .slice(0, 3)
        .map((k) => `${fields[k]?.value ?? fields[k]?.valueString ?? '?'}`)
        .join(', ')
      const summary = elemCount > 0 ? `[ ${sampleElems}${elemCount > 3 ? '...' : ''} ]` : '[ ]'
      return { type: 'ARRAY', summary }
    }

    // 3. Binary Tree Node (contains valid reference fields for 'left' or 'right')
    const hasLeft = fieldNames.some((f) => isStructuralRef(f, 'left', fields[f]))
    const hasRight = fieldNames.some((f) => isStructuralRef(f, 'right', fields[f]))
    if (hasLeft || hasRight) {
      const valKey = fieldNames.find(
        (f) => !isStructuralRef(f, 'left', fields[f]) && !isStructuralRef(f, 'right', fields[f]),
      )
      const valStr = valKey
        ? `${valKey}: ${fields[valKey]?.value ?? fields[valKey]?.valueString ?? ''}`
        : ''
      return { type: 'BINARY_TREE', summary: valStr }
    }

    // 4. Linked List Node (contains valid reference fields for 'next' or 'prev')
    const hasNext = fieldNames.some((f) => isStructuralRef(f, 'next', fields[f]))
    const hasPrev = fieldNames.some((f) => isStructuralRef(f, 'prev', fields[f]))
    if (hasNext || hasPrev) {
      const valKey = fieldNames.find(
        (f) => !isStructuralRef(f, 'next', fields[f]) && !isStructuralRef(f, 'prev', fields[f]),
      )
      const valStr = valKey
        ? `${valKey}: ${fields[valKey]?.value ?? fields[valKey]?.valueString ?? ''}`
        : ''
      return { type: 'LINKED_LIST', summary: valStr }
    }

    // 5. Stack
    if (
      typeStr.toLowerCase().includes('stack') ||
      fieldNames.some((f) => f.toLowerCase() === 'top' && (isReferenceField(fields[f]) || fields[f]?.kind === 'int'))
    ) {
      return { type: 'STACK', summary: 'Stack' }
    }

    // 6. Queue
    if (
      typeStr.toLowerCase().includes('queue') ||
      fieldNames.some((f) => f.toLowerCase() === 'front')
    ) {
      return { type: 'QUEUE', summary: 'Queue' }
    }

    // 7. General Heap Object: extract first 2 primitive/string field values for clear card display
    const primFields = fieldNames
      .filter(
        (k) =>
          fields[k]?.kind === 'primitive' ||
          fields[k]?.kind === 'int' ||
          fields[k]?.kind === 'string',
      )
      .slice(0, 2)
      .map((k) => `${k}: ${fields[k]?.value ?? fields[k]?.valueString ?? ''}`)
      .join('\n')

    return { type: 'OBJECT', summary: primFields }
  }
}

export default DataStructureClassifier
