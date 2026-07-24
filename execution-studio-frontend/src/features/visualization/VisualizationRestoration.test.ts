import { describe, it, expect } from 'vitest'
import { transformToEducationalTimeline, type RawTraceEvent } from '@/features/timeline/transformToEducationalTimeline'

describe('Visualization Restoration — Educational Timeline & Reference Pipeline', () => {
  it('Program 1: Student s = new Student() connects stack variable s to Student heap object', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: 'main',
        lineNumber: 6,
        callStack: [
          {
            className: 'Student',
            methodName: 'main',
            lineNumber: 6,
            locals: [
              { name: 'args', declaredType: 'String[]', value: { kind: 'array_ref', objectId: 'obj_1', value: 'String[0]' } },
              { name: 's', declaredType: 'Student', value: { kind: 'object_ref', objectId: 'obj_2', value: 'Student@1' } },
            ],
          },
        ],
        heapObjects: {
          obj_1: { objectId: 'obj_1', type: 'array', classNameOrType: 'java.lang.String[]', elements: [] },
          obj_2: {
            objectId: 'obj_2',
            type: 'object',
            classNameOrType: 'Student',
            fields: { name: { kind: 'string', value: 'John' } },
          },
        },
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(1)

    const step = steps[0]
    const vars = step.visualizationState.variables.variables
    expect(vars).toHaveLength(2)

    const varArgs = vars.find((v) => v.name === 'args')
    expect(varArgs?.value.objectId).toBe('obj_1')
    expect(varArgs?.value.kind).toBe('array_ref')

    const varS = vars.find((v) => v.name === 's')
    expect(varS?.value.objectId).toBe('obj_2')
    expect(varS?.value.kind).toBe('object_ref')

    const heap = step.visualizationState.heap.objects
    expect(heap['obj_1']).toBeDefined()
    expect(heap['obj_2']).toBeDefined()
    expect(heap['obj_2'].fieldsOrElements['name'].value).toBe('John')
  })

  it('Program 2: Person p = new Person() connects Person -> Address nested object references', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Person.java',
        className: 'Person',
        methodName: 'main',
        lineNumber: 10,
        callStack: [
          {
            className: 'Person',
            methodName: 'main',
            lineNumber: 10,
            locals: [{ name: 'p', declaredType: 'Person', value: { kind: 'object_ref', objectId: 'obj_person', value: 'Person@1' } }],
          },
        ],
        heapObjects: {
          obj_person: {
            objectId: 'obj_person',
            type: 'object',
            classNameOrType: 'Person',
            fields: {
              address: { kind: 'object_ref', objectId: 'obj_address', value: 'Address@1' },
            },
          },
          obj_address: {
            objectId: 'obj_address',
            type: 'object',
            classNameOrType: 'Address',
            fields: { city: { kind: 'string', value: 'Chennai' } },
          },
        },
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    const heap = steps[0].visualizationState.heap.objects

    expect(heap['obj_person']).toBeDefined()
    expect(heap['obj_address']).toBeDefined()

    const addressField = heap['obj_person'].fieldsOrElements['address']
    expect(addressField.objectId).toBe('obj_address')
    expect(addressField.kind).toBe('object_ref')
  })

  it('Program 3: Student[] arr resolves array cells to Student object references', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 5,
        callStack: [
          {
            className: 'Main',
            methodName: 'main',
            lineNumber: 5,
            locals: [{ name: 'arr', declaredType: 'Student[]', value: { kind: 'array_ref', objectId: 'obj_arr' } }],
          },
        ],
        heapObjects: {
          obj_arr: {
            objectId: 'obj_arr',
            type: 'array',
            classNameOrType: 'Student[]',
            elements: [
              { kind: 'object_ref', objectId: 'obj_s1' },
              { kind: 'object_ref', objectId: 'obj_s2' },
            ],
          },
          obj_s1: { objectId: 'obj_s1', type: 'object', classNameOrType: 'Student' },
          obj_s2: { objectId: 'obj_s2', type: 'object', classNameOrType: 'Student' },
        },
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    const arrObj = steps[0].visualizationState.heap.objects['obj_arr']

    expect(arrObj.fieldsOrElements['0'].objectId).toBe('obj_s1')
    expect(arrObj.fieldsOrElements['1'].objectId).toBe('obj_s2')
  })

  it('Program 4: LinkedList<Node> connects next and prev node references', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'LinkedList.java',
        className: 'LinkedList',
        methodName: 'main',
        lineNumber: 12,
        callStack: [
          {
            className: 'LinkedList',
            methodName: 'main',
            lineNumber: 12,
            locals: [{ name: 'head', declaredType: 'Node', value: { kind: 'object_ref', objectId: 'node_1' } }],
          },
        ],
        heapObjects: {
          node_1: {
            objectId: 'node_1',
            type: 'object',
            classNameOrType: 'Node',
            fields: {
              val: { kind: 'int', value: 10 },
              next: { kind: 'object_ref', objectId: 'node_2' },
            },
          },
          node_2: {
            objectId: 'node_2',
            type: 'object',
            classNameOrType: 'Node',
            fields: {
              val: { kind: 'int', value: 20 },
              prev: { kind: 'object_ref', objectId: 'node_1' },
            },
          },
        },
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    const heap = steps[0].visualizationState.heap.objects

    expect(heap['node_1'].fieldsOrElements['next'].objectId).toBe('node_2')
    expect(heap['node_2'].fieldsOrElements['prev'].objectId).toBe('node_1')
  })

  it('Program 5: Shared references Node a = n and Node b = n resolve to same Heap object', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 8,
        callStack: [
          {
            className: 'Main',
            methodName: 'main',
            lineNumber: 8,
            locals: [
              { name: 'n', declaredType: 'Node', value: { kind: 'object_ref', objectId: 'shared_node' } },
              { name: 'a', declaredType: 'Node', value: { kind: 'object_ref', objectId: 'shared_node' } },
              { name: 'b', declaredType: 'Node', value: { kind: 'object_ref', objectId: 'shared_node' } },
            ],
          },
        ],
        heapObjects: {
          shared_node: { objectId: 'shared_node', type: 'object', classNameOrType: 'Node' },
        },
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    const vars = steps[0].visualizationState.variables.variables

    const varN = vars.find((v) => v.name === 'n')
    const varA = vars.find((v) => v.name === 'a')
    const varB = vars.find((v) => v.name === 'b')

    expect(varN?.value.objectId).toBe('shared_node')
    expect(varA?.value.objectId).toBe('shared_node')
    expect(varB?.value.objectId).toBe('shared_node')
  })
})
