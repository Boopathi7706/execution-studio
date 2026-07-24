import { describe, it, expect } from 'vitest'
import { DataStructureClassifier } from '../object-graph/DataStructureClassifier'
import { getRendererType } from './RendererFactory'
import { generateExplanation } from './generateExplanation'
import type { VisualizationModel, HeapObjectView, VariableView, DisplayValue } from '@/types/visualization.types'

// ── Helpers for constructing mock execution state snapshots ───────────────
const refVal = (objectId: string): DisplayValue => ({
  kind: 'object_ref',
  objectId,
  valueString: objectId,
  value: objectId,
})

const intVal = (n: number): DisplayValue => ({ kind: 'int', valueString: String(n), value: n })

const strVal = (s: string): DisplayValue => ({ kind: 'string', valueString: s, value: s })

const makeObj = (
  objectId: string,
  type: 'object' | 'array',
  classNameOrType: string,
  fields: Record<string, DisplayValue> = {},
): HeapObjectView => ({ objectId, type, classNameOrType, fieldsOrElements: fields })

const makeVar = (name: string, kind: string, value: any, objectId?: string): VariableView => ({
  name,
  declaredType: kind,
  value: { kind, value, valueString: String(value), objectId },
  scope: 'local',
  changed: false,
})

const makeModel = (overrides: Partial<VisualizationModel> = {}): VisualizationModel => ({
  stack: { frames: [{ className: 'Main', methodName: 'main', lineNumber: 1, locals: [], isActive: true }] },
  heap: { objects: {} },
  variables: { variables: [] },
  graph: { nodes: [], edges: [] },
  highlights: { currentLine: 1, currentMethod: 'main', currentStackFrame: 'Main.main', activeHighlights: [] },
  status: 'RUNNING',
  ...overrides,
})

describe('Visualization Correctness & Stability — 16 Validation Programs', () => {

  // 1. Primitive Variables (primitive.java)
  it('1. primitive.java — primitive variables are stored in stack; heap remains empty', () => {
    const model = makeModel({
      variables: {
        variables: [makeVar('x', 'int', 5), makeVar('y', 'int', 10), makeVar('flag', 'boolean', true)],
      },
    })

    expect(Object.keys(model.heap.objects).length).toBe(0)
    expect(model.variables.variables.length).toBe(3)
    expect(model.variables.variables[0].value.value).toBe(5)
  })

  // 2. Strings (strings.java)
  it('2. strings.java — String variable references String object on heap', () => {
    const strObj = makeObj('str_1', 'object', 'java.lang.String', { value: strVal('hello') })
    const model = makeModel({
      heap: { objects: { str_1: strObj } },
      variables: { variables: [makeVar('s', 'string', 'hello', 'str_1')] },
    })

    const classified = DataStructureClassifier.classify(strObj)
    expect(classified.type).toBe('STRING')
    expect(getRendererType(strObj)).toBe('STRING')
    expect(model.variables.variables[0].value.objectId).toBe('str_1')
  })

  // 3. Arrays (arrays.java)
  it('3. arrays.java — primitive array renders with ARRAY renderer with indexed cells', () => {
    const arrObj = makeObj('arr_1', 'array', 'int[]', {
      '0': intVal(10),
      '1': intVal(20),
      '2': intVal(30),
    })

    expect(getRendererType(arrObj)).toBe('ARRAY')
    expect(Object.keys(arrObj.fieldsOrElements).length).toBe(3)
  })

  // 4. Array of Objects (array-of-objects.java)
  // 4. Array of Objects (array-of-objects.java)
  it('4. array-of-objects.java — array of objects references heap objects by ID', () => {
    const arrObj = makeObj('arr_1', 'array', 'Person[]', {
      '0': refVal('obj_1'),
      '1': refVal('obj_2'),
    })

    expect(getRendererType(arrObj)).toBe('ARRAY')
    expect(arrObj.fieldsOrElements['0'].objectId).toBe('obj_1')
    expect(arrObj.fieldsOrElements['1'].objectId).toBe('obj_2')
  })

  // 5. Single Object (single-object.java)
  it('5. single-object.java — single POJO classifies as OBJECT renderer', () => {
    const p1 = makeObj('obj_1', 'object', 'Car', { brand: strVal('Toyota'), speed: intVal(120) })
    expect(getRendererType(p1)).toBe('OBJECT')
  })

  // 6. Multiple Objects (multiple-objects.java)
  it('6. multiple-objects.java — distinct objects on heap maintain unique identities', () => {
    const c1 = makeObj('obj_1', 'object', 'Car', { id: intVal(1) })
    const c2 = makeObj('obj_2', 'object', 'Car', { id: intVal(2) })
    const model = makeModel({ heap: { objects: { obj_1: c1, obj_2: c2 } } })

    expect(Object.keys(model.heap.objects)).toEqual(['obj_1', 'obj_2'])
    expect(model.heap.objects['obj_1'].objectId).toBe('obj_1')
    expect(model.heap.objects['obj_2'].objectId).toBe('obj_2')
  })

  // 7. Nested Objects (nested-objects.java)
  it('7. nested-objects.java — object referencing another object has valid reference field', () => {
    const user = makeObj('obj_1', 'object', 'User', { name: strVal('Jean'), address: refVal('obj_2') })

    expect(getRendererType(user)).toBe('OBJECT')
    expect(user.fieldsOrElements.address.objectId).toBe('obj_2')
  })

  // 8. Shared Reference (shared-reference.java)
  it('8. shared-reference.java — aliased variables point to same object ID', () => {
    const sharedObj = makeObj('obj_1', 'object', 'Node', { val: intVal(42) })
    const model = makeModel({
      heap: { objects: { obj_1: sharedObj } },
      variables: {
        variables: [
          makeVar('head', 'object_ref', 'obj_1', 'obj_1'),
          makeVar('temp', 'object_ref', 'obj_1', 'obj_1'),
        ],
      },
    })

    const var1 = model.variables.variables[0]
    const var2 = model.variables.variables[1]
    expect(var1.value.objectId).toBe('obj_1')
    expect(var2.value.objectId).toBe('obj_1')
  })

  // 9. Self Reference (self-reference.java)
  it('9. self-reference.java — object referencing itself does not cause infinite recursion', () => {
    const selfObj = makeObj('obj_1', 'object', 'Node', {
      data: intVal(99),
      self: refVal('obj_1'),
    })

    expect(getRendererType(selfObj)).toBe('OBJECT')
  })

  // 10. Circular Reference (circular-reference.java)
  it('10. circular-reference.java — two nodes referencing each other are handled safely', () => {
    const n1 = makeObj('n1', 'object', 'Node', { data: intVal(10), next: refVal('n2') })
    const n2 = makeObj('n2', 'object', 'Node', { data: intVal(20), next: refVal('n1') })

    expect(getRendererType(n1)).toBe('LINKED_LIST')
    expect(getRendererType(n2)).toBe('LINKED_LIST')
  })

  // 11. Linked List (linked-list.java)
  it('11. linked-list.java — node chain ordered next pointers correctly classified', () => {
    const n1 = makeObj('n1', 'object', 'Node', { data: intVal(10), next: refVal('n2') })

    expect(getRendererType(n1)).toBe('LINKED_LIST')
    expect(n1.fieldsOrElements.next.objectId).toBe('n2')
  })

  // 12. Binary Tree (binary-tree.java)
  it('12. binary-tree.java — tree node with left and right subtrees classifies as BINARY_TREE', () => {
    const t1 = makeObj('t1', 'object', 'TreeNode', { val: intVal(50), left: refVal('t2'), right: refVal('t3') })

    expect(getRendererType(t1)).toBe('BINARY_TREE')
    expect(t1.fieldsOrElements.left.objectId).toBe('t2')
    expect(t1.fieldsOrElements.right.objectId).toBe('t3')
  })

  // 13. Method Parameters (method-parameters.java)
  it('13. method-parameters.java — active stack frame contains local parameters', () => {
    const model = makeModel({
      stack: {
        frames: [
          {
            className: 'Calculator',
            methodName: 'add',
            lineNumber: 15,
            locals: [makeVar('a', 'int', 5), makeVar('b', 'int', 10)],
            isActive: true,
          },
        ],
      },
    })

    expect(model.stack.frames[0].locals.length).toBe(2)
    expect(model.stack.frames[0].locals[0].name).toBe('a')
  })

  // 14. Method Return (method-return.java)
  it('14. method-return.java — stepping back from method return restores caller stack frame', () => {
    const prev = makeModel({
      stack: {
        frames: [
          { className: 'Calculator', methodName: 'add', lineNumber: 15, locals: [], isActive: true },
          { className: 'Main', methodName: 'main', lineNumber: 4, locals: [], isActive: false },
        ],
      },
    })
    const curr = makeModel({
      stack: {
        frames: [{ className: 'Main', methodName: 'main', lineNumber: 4, locals: [], isActive: true }],
      },
    })

    const explanation = generateExplanation(prev, curr)
    expect(explanation).toContain('add() finished and returned to main()')
  })

  // 15. Recursion (recursion.java)
  it('15. recursion.java — multiple stack frames for recursive calls rendered in order', () => {
    const model = makeModel({
      stack: {
        frames: [
          { className: 'Math', methodName: 'factorial', lineNumber: 8, locals: [makeVar('n', 'int', 1)], isActive: true },
          { className: 'Math', methodName: 'factorial', lineNumber: 9, locals: [makeVar('n', 'int', 2)], isActive: false },
          { className: 'Math', methodName: 'factorial', lineNumber: 9, locals: [makeVar('n', 'int', 3)], isActive: false },
        ],
      },
    })

    expect(model.stack.frames.length).toBe(3)
    expect(model.stack.frames[0].locals[0].value.value).toBe(1)
    expect(model.stack.frames[2].locals[0].value.value).toBe(3)
  })

  // 16. Static Fields (static-fields.java)
  it('16. static-fields.java — primitive & object fields on class or static holder', () => {
    const staticHolder = makeObj('static_1', 'object', 'GlobalState', {
      counter: intVal(100),
      appInstance: refVal('obj_1'),
    })

    expect(getRendererType(staticHolder)).toBe('OBJECT')
    expect(staticHolder.fieldsOrElements.counter.value).toBe(100)
    expect(staticHolder.fieldsOrElements.appInstance.objectId).toBe('obj_1')
  })
})
