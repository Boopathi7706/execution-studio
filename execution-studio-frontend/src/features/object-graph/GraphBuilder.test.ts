import { describe, it, expect } from 'vitest'
import { GraphBuilder } from './GraphBuilder'
import { MemoryCanvasLayoutEngine } from './MemoryCanvasLayoutEngine'
import type { HeapObjectView, VariableView } from '@/types/visualization.types'

describe('MemoryCanvasLayoutEngine Placement Tests (Rules 6, 7 & 8)', () => {
  it('places linked list next nodes horizontally right (+185px)', () => {
    const engine = new MemoryCanvasLayoutEngine()
    const parentPos = engine.getPosition('obj_1', undefined, undefined, 0)
    expect(parentPos).toEqual({ x: 100, y: 120 })

    const nextPos = engine.getPosition('obj_2', 'obj_1', 'next', 1)
    expect(nextPos).toEqual({ x: 100 + 185, y: 120 })
  })

  it('places binary tree left and right children below parent (-120px / +120px, +140px)', () => {
    const engine = new MemoryCanvasLayoutEngine()
    const rootPos = engine.getPosition('root', undefined, undefined, 0)
    expect(rootPos).toEqual({ x: 100, y: 120 })

    const leftPos = engine.getPosition('leftNode', 'root', 'left', 1)
    expect(leftPos).toEqual({ x: 100 - 120, y: 120 + 140 })

    const rightPos = engine.getPosition('rightNode', 'root', 'right', 2)
    expect(rightPos).toEqual({ x: 100 + 120, y: 120 + 140 })
  })

  it('preserves cached position when requested again', () => {
    const engine = new MemoryCanvasLayoutEngine()
    engine.getPosition('obj_1')
    engine.setPosition('obj_1', { x: 500, y: 300 })
    const pos2 = engine.getPosition('obj_1')
    expect(pos2).toEqual({ x: 500, y: 300 })
  })
})

describe('GraphBuilder Unit Tests (JVM Memory Model Topology)', () => {
  it('attaches local stack frame variables as pin labels to referenced heap objects', () => {
    const heap: Record<string, HeapObjectView> = {
      obj_node: {
        objectId: 'obj_node',
        type: 'object',
        classNameOrType: 'Node',
        fieldsOrElements: { val: { kind: 'int', value: 10 } },
      },
    }

    const variables: VariableView[] = [
      {
        name: 'head',
        declaredType: 'Node',
        value: { kind: 'object_ref', objectId: 'obj_node' },
        scope: 'local',
        changed: false,
      },
      {
        name: 'temp',
        declaredType: 'Node',
        value: { kind: 'object_ref', objectId: 'obj_node' },
        scope: 'local',
        changed: false,
      },
      {
        name: 'x',
        declaredType: 'int',
        value: { kind: 'int', value: 5 },
        scope: 'local',
        changed: false,
      },
    ]

    const { nodes, edges } = GraphBuilder.build(heap, variables)

    // Invariant 1 & 2: Graph contains ONLY 1 heap object node (local variables are NOT graph nodes)
    expect(nodes.length).toBe(1)
    expect(nodes[0].id).toBe('obj_node')

    // Invariant 3 & 4: Both 'head' and 'temp' attach as variable annotation labels on @obj_node
    expect(nodes[0].variableLabels).toEqual(['head', 'temp'])
    expect(edges.length).toBe(0)
  })

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

  it('handles self-referential pointer edges (e.g. node.next = node)', () => {
    const heap: Record<string, HeapObjectView> = {
      obj_self: {
        objectId: 'obj_self',
        type: 'object',
        classNameOrType: 'Node',
        fieldsOrElements: {
          selfRef: { kind: 'object_ref', objectId: 'obj_self' },
        },
      },
    }

    const { nodes, edges } = GraphBuilder.build(heap)
    expect(nodes.length).toBe(1)
    expect(edges.length).toBe(1)
    expect(edges[0].source).toBe('obj_self')
    expect(edges[0].target).toBe('obj_self')
    expect(edges[0].fieldName).toBe('selfRef')
  })

  it('handles multiple fields pointing to the same target object without dropping edges', () => {
    const heap: Record<string, HeapObjectView> = {
      obj_list: {
        objectId: 'obj_list',
        type: 'object',
        classNameOrType: 'LinkedList',
        fieldsOrElements: {
          head: { kind: 'object_ref', objectId: 'obj_node' },
          tail: { kind: 'object_ref', objectId: 'obj_node' },
        },
      },
      obj_node: {
        objectId: 'obj_node',
        type: 'object',
        classNameOrType: 'Node',
        fieldsOrElements: { val: { kind: 'int', value: 42 } },
      },
    }

    const { nodes, edges } = GraphBuilder.build(heap)
    expect(nodes.length).toBe(2)
    expect(edges.length).toBe(2)
    const headEdge = edges.find((e) => e.fieldName === 'head')
    const tailEdge = edges.find((e) => e.fieldName === 'tail')
    expect(headEdge?.target).toBe('obj_node')
    expect(tailEdge?.target).toBe('obj_node')
  })

  it('strictly ignores null references and generates zero edges or orphan null nodes', () => {
    const heap: Record<string, HeapObjectView> = {
      obj_node: {
        objectId: 'obj_node',
        type: 'object',
        classNameOrType: 'Node',
        fieldsOrElements: {
          next: { kind: 'null', value: 'null', valueString: 'null' },
        },
      },
    }

    const { nodes, edges } = GraphBuilder.build(heap)
    expect(nodes.length).toBe(1)
    expect(edges.length).toBe(0)
  })

  it('skips unknown/missing target objectIds without inventing guessing placeholder nodes', () => {
    const heap: Record<string, HeapObjectView> = {
      obj_node: {
        objectId: 'obj_node',
        type: 'object',
        classNameOrType: 'Node',
        fieldsOrElements: {
          next: { kind: 'object_ref', objectId: 'obj_missing_999' },
        },
      },
    }

    const { nodes, edges } = GraphBuilder.build(heap)
    expect(nodes.length).toBe(1)
    expect(edges.length).toBe(0) // Unknown target objectId is safely skipped
  })

  it('handles empty heap cleanly', () => {
    const { nodes, edges } = GraphBuilder.build({})
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })
})
