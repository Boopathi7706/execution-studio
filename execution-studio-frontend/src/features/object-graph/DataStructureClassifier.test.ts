import { describe, it, expect } from 'vitest'
import { DataStructureClassifier } from './DataStructureClassifier'
import type { HeapObjectView } from '@/types/visualization.types'

describe('DataStructureClassifier Unit Tests', () => {
  it('classifies String objects', () => {
    const obj: HeapObjectView = {
      objectId: '0x0010',
      type: 'object',
      classNameOrType: 'java.lang.String',
      fieldsOrElements: { value: { kind: 'string', value: 'Hello' } },
    }
    const { type, summary } = DataStructureClassifier.classify(obj)
    expect(type).toBe('STRING')
    expect(summary).toBe('"Hello"')
  })

  it('classifies Array objects', () => {
    const obj: HeapObjectView = {
      objectId: '0x0020',
      type: 'array',
      classNameOrType: 'int[]',
      fieldsOrElements: {
        '[0]': { kind: 'int', value: 10 },
        '[1]': { kind: 'int', value: 20 },
      },
    }
    const { type, summary } = DataStructureClassifier.classify(obj)
    expect(type).toBe('ARRAY')
    expect(summary).toBe('[ 10, 20 ]')
  })

  it('classifies Linked List Nodes', () => {
    const obj: HeapObjectView = {
      objectId: '0x0030',
      type: 'object',
      classNameOrType: 'Node',
      fieldsOrElements: {
        data: { kind: 'int', value: 42 },
        next: { kind: 'object_ref', objectId: '0x0031' },
      },
    }
    const { type, summary } = DataStructureClassifier.classify(obj)
    expect(type).toBe('LINKED_LIST')
    expect(summary).toBe('data: 42')
  })

  it('classifies Binary Tree Nodes', () => {
    const obj: HeapObjectView = {
      objectId: '0x0040',
      type: 'object',
      classNameOrType: 'TreeNode',
      fieldsOrElements: {
        val: { kind: 'int', value: 50 },
        left: { kind: 'object_ref', objectId: '0x0041' },
        right: { kind: 'object_ref', objectId: '0x0042' },
      },
    }
    const { type, summary } = DataStructureClassifier.classify(obj)
    expect(type).toBe('BINARY_TREE')
    expect(summary).toBe('val: 50')
  })

  it('classifies General Class Objects into memory cards with field summaries', () => {
    const obj: HeapObjectView = {
      objectId: '0x0050',
      type: 'object',
      classNameOrType: 'Student',
      fieldsOrElements: {
        id: { kind: 'int', value: 101 },
        name: { kind: 'string', value: 'John' },
      },
    }
    const { type, summary } = DataStructureClassifier.classify(obj)
    expect(type).toBe('OBJECT')
    expect(summary).toContain('id: 101')
    expect(summary).toContain('name: John')
  })
})
