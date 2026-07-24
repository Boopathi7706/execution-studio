import { describe, it, expect } from 'vitest'
import { generateExplanation } from './generateExplanation'
import type { VisualizationModel, HeapObjectView, VariableView } from '@/types/visualization.types'

const makeModel = (overrides: Partial<VisualizationModel> = {}): VisualizationModel => ({
  stack: { frames: [{ className: 'Test', methodName: 'main', lineNumber: 5, locals: [], isActive: true }] },
  heap: { objects: {} },
  variables: { variables: [] },
  graph: { nodes: [], edges: [] },
  highlights: { currentLine: 5, currentMethod: 'main', currentStackFrame: 'Test.main', activeHighlights: [] },
  status: 'RUNNING',
  ...overrides,
})

const makeObj = (objectId: string, classNameOrType: string, fields: Record<string, any> = {}): HeapObjectView => ({
  objectId,
  type: 'object',
  classNameOrType,
  fieldsOrElements: fields,
})

const makeArrObj = (objectId: string, classNameOrType: string, fields: Record<string, any> = {}): HeapObjectView => ({
  objectId,
  type: 'array',
  classNameOrType,
  fieldsOrElements: fields,
})

const makeVar = (name: string, kind: string, value: any, objectId?: string): VariableView => ({
  name,
  declaredType: kind,
  value: { kind, value, valueString: String(value), objectId },
  scope: 'local',
  changed: false,
})

describe('generateExplanation', () => {
  it('returns empty string when current model is null', () => {
    expect(generateExplanation(null, null)).toBe('')
  })

  it('describes executing line when no changes detected', () => {
    const curr = makeModel({ highlights: { currentLine: 7, currentMethod: 'sort', currentStackFrame: 'Test.sort', activeHighlights: [] } })
    // Pass a prev with the same single frame so no frame change is detected
    const prev = makeModel({ highlights: { currentLine: 7, currentMethod: 'sort', currentStackFrame: 'Test.sort', activeHighlights: [] } })
    const result = generateExplanation(prev, curr)
    expect(result).toContain('sort')
    expect(result).toContain('7')
  })

  it('detects new method call (more frames than prev)', () => {
    const prev = makeModel({
      stack: { frames: [{ className: 'Test', methodName: 'main', lineNumber: 3, locals: [], isActive: true }] },
    })
    const curr = makeModel({
      stack: {
        frames: [
          { className: 'Test', methodName: 'insert', lineNumber: 12, locals: [], isActive: true },
          { className: 'Test', methodName: 'main', lineNumber: 3, locals: [], isActive: false },
        ],
      },
    })
    const result = generateExplanation(prev, curr)
    expect(result).toMatch(/insert/)
    expect(result).toMatch(/main/)
  })

  it('detects method return (fewer frames than prev)', () => {
    const prev = makeModel({
      stack: {
        frames: [
          { className: 'Test', methodName: 'insert', lineNumber: 12, locals: [], isActive: true },
          { className: 'Test', methodName: 'main', lineNumber: 5, locals: [], isActive: false },
        ],
      },
    })
    const curr = makeModel({
      stack: { frames: [{ className: 'Test', methodName: 'main', lineNumber: 5, locals: [], isActive: true }] },
    })
    const result = generateExplanation(prev, curr)
    expect(result).toMatch(/insert/)
    expect(result).toMatch(/main/)
  })

  it('detects new object allocated on heap', () => {
    const prev = makeModel({ heap: { objects: {} } })
    const curr = makeModel({ heap: { objects: { obj_1: makeObj('obj_1', 'Node') } } })
    const result = generateExplanation(prev, curr)
    expect(result).toMatch(/Node/)
    expect(result).toMatch(/heap/)
  })

  it('detects new array allocated on heap', () => {
    const prev = makeModel({ heap: { objects: {} } })
    const curr = makeModel({
      heap: {
        objects: {
          arr_1: makeArrObj('arr_1', 'int[]', { '0': { kind: 'int', valueString: '0', value: 0 }, '1': { kind: 'int', valueString: '0', value: 0 } }),
        },
      },
    })
    const result = generateExplanation(prev, curr)
    expect(result).toMatch(/array/)
    expect(result).toMatch(/heap/)
  })

  it('detects new primitive variable declared', () => {
    const prev = makeModel({ variables: { variables: [] } })
    const curr = makeModel({
      variables: { variables: [makeVar('x', 'int', 42)] },
    })
    const result = generateExplanation(prev, curr)
    expect(result).toContain("'x'")
    expect(result).toMatch(/42|stack/)
  })

  it('detects variable reassignment', () => {
    const prev = makeModel({ variables: { variables: [makeVar('x', 'int', 10)] } })
    const curr = makeModel({ variables: { variables: [makeVar('x', 'int', 99)] } })
    const result = generateExplanation(prev, curr)
    expect(result).toContain("'x'")
    expect(result).toContain('99')
  })

  it('detects object reference variable assignment', () => {
    // Node object pre-exists in both prev and curr so no new-object event fires
    const existingNode = makeObj('obj_1', 'Node')
    const prev = makeModel({
      variables: { variables: [] },
      heap: { objects: { obj_1: existingNode } },
    })
    const curr = makeModel({
      variables: { variables: [makeVar('head', 'object_ref', 'obj_1', 'obj_1')] },
      heap: { objects: { obj_1: existingNode } },
    })
    const result = generateExplanation(prev, curr)
    expect(result).toContain("'head'")
    expect(result).toMatch(/Node|heap/)
  })

  it('detects null assignment to variable', () => {
    const prev = makeModel({ variables: { variables: [makeVar('head', 'object_ref', 'obj_1', 'obj_1')] } })
    const curr = makeModel({ variables: { variables: [makeVar('head', 'null', 'null')] } })
    const result = generateExplanation(prev, curr)
    expect(result).toContain("'head'")
    expect(result).toContain('null')
  })

  it('detects heap object field update', () => {
    const prevObj = makeObj('obj_1', 'Node', {
      data: { kind: 'int', valueString: '10', value: 10 },
    })
    const currObj = makeObj('obj_1', 'Node', {
      data: { kind: 'int', valueString: '99', value: 99 },
    })
    const prev = makeModel({ heap: { objects: { obj_1: prevObj } } })
    const curr = makeModel({ heap: { objects: { obj_1: currObj } } })
    const result = generateExplanation(prev, curr)
    expect(result).toMatch(/data|Node/)
    expect(result).toContain('99')
  })
})
