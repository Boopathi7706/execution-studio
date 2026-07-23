import type { HeapObjectView } from '@/types/visualization.types'
import type { GraphNodeType } from './GraphNode'

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

    // 3. Binary Tree Node (contains both 'left' and 'right')
    const hasLeft = fieldNames.some((f) => f.toLowerCase().includes('left'))
    const hasRight = fieldNames.some((f) => f.toLowerCase().includes('right'))
    if (hasLeft || hasRight) {
      const valKey = fieldNames.find(
        (f) => !f.toLowerCase().includes('left') && !f.toLowerCase().includes('right'),
      )
      const valStr = valKey
        ? `${valKey}: ${fields[valKey]?.value ?? fields[valKey]?.valueString ?? ''}`
        : ''
      return { type: 'BINARY_TREE', summary: valStr }
    }

    // 4. Linked List Node (contains 'next' or 'prev')
    const hasNext = fieldNames.some((f) => f.toLowerCase().includes('next'))
    const hasPrev = fieldNames.some((f) => f.toLowerCase().includes('prev'))
    if (hasNext || hasPrev) {
      const valKey = fieldNames.find(
        (f) => !f.toLowerCase().includes('next') && !f.toLowerCase().includes('prev'),
      )
      const valStr = valKey
        ? `${valKey}: ${fields[valKey]?.value ?? fields[valKey]?.valueString ?? ''}`
        : ''
      return { type: 'LINKED_LIST', summary: valStr }
    }

    // 5. Stack
    if (
      typeStr.toLowerCase().includes('stack') ||
      fieldNames.some((f) => f.toLowerCase().includes('top'))
    ) {
      return { type: 'STACK', summary: 'Stack' }
    }

    // 6. Queue
    if (
      typeStr.toLowerCase().includes('queue') ||
      fieldNames.some((f) => f.toLowerCase().includes('front'))
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
