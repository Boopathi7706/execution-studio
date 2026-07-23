import { describe, it, expect } from 'vitest'
import { GraphBuilder } from './GraphBuilder'
import type { HeapObjectView } from '@/types/visualization.types'

describe('GraphBuilder Unit Tests (Phase 2)', () => {
  it('builds Program 1 Graph: Student -> Address -> String', () => {
    const heap: Record<string, HeapObjectView> = {
      obj_student: {
        objectId: 'obj_student',
        type: 'object',
        classNameOrType: 'Student',
        fieldsOrElements: {
          address: { kind: 'object_ref', objectId: 'obj_addr' },
        },
      },
      obj_addr: {
        objectId: 'obj_addr',
        type: 'object',
        classNameOrType: 'Address',
        fieldsOrElements: {
          city: { kind: 'string', value: 'Chennai', objectId: 'obj_str' },
        },
      },
      obj_str: {
        objectId: 'obj_str',
        type: 'object',
        classNameOrType: 'java.lang.String',
        fieldsOrElements: {
          value: { kind: 'primitive', value: 'Chennai' },
        },
      },
    }

    const { nodes, edges } = GraphBuilder.build(heap)

    expect(nodes.length).toBe(3)
    const studentNode = nodes.find((n) => n.id === 'obj_student')
    const addressNode = nodes.find((n) => n.id === 'obj_addr')
    const stringNode = nodes.find((n) => n.id === 'obj_str')

    expect(studentNode).toBeDefined()
    expect(studentNode?.type).toBe('OBJECT')

    expect(addressNode).toBeDefined()
    expect(addressNode?.type).toBe('OBJECT')

    expect(stringNode).toBeDefined()
    expect(stringNode?.type).toBe('STRING')

    expect(edges.length).toBe(2)
    const addrEdge = edges.find((e) => e.fieldName === 'address')
    const cityEdge = edges.find((e) => e.fieldName === 'city')

    expect(addrEdge?.source).toBe('obj_student')
    expect(addrEdge?.target).toBe('obj_addr')

    expect(cityEdge?.source).toBe('obj_addr')
    expect(cityEdge?.target).toBe('obj_str')
  })

  it('builds Program 2 Graph: Integer[] Array -> Reference Edges [0], [1], [2]', () => {
    const heap: Record<string, HeapObjectView> = {
      obj_arr: {
        objectId: 'obj_arr',
        type: 'array',
        classNameOrType: 'Integer[]',
        fieldsOrElements: {
          '[0]': { kind: 'object_ref', objectId: 'obj_num1' },
          '[1]': { kind: 'object_ref', objectId: 'obj_num2' },
          '[2]': { kind: 'object_ref', objectId: 'obj_num3' },
        },
      },
      obj_num1: {
        objectId: 'obj_num1',
        type: 'object',
        classNameOrType: 'Integer',
        fieldsOrElements: { value: { kind: 'int', value: 10 } },
      },
      obj_num2: {
        objectId: 'obj_num2',
        type: 'object',
        classNameOrType: 'Integer',
        fieldsOrElements: { value: { kind: 'int', value: 20 } },
      },
      obj_num3: {
        objectId: 'obj_num3',
        type: 'object',
        classNameOrType: 'Integer',
        fieldsOrElements: { value: { kind: 'int', value: 30 } },
      },
    }

    const { nodes, edges } = GraphBuilder.build(heap)

    expect(nodes.length).toBe(4)
    const arrayNode = nodes.find((n) => n.id === 'obj_arr')
    expect(arrayNode?.type).toBe('ARRAY')

    expect(edges.length).toBe(3)
    expect(edges.map((e) => e.fieldName)).toEqual(['[0]', '[1]', '[2]'])
  })

  it('handles empty heap cleanly', () => {
    const { nodes, edges } = GraphBuilder.build({})
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })
})
