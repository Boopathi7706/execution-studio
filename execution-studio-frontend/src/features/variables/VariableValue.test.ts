import { describe, it, expect } from 'vitest'
import { formatVariableValue } from './VariableValue'
import type { VariableView } from '@/types/visualization.types'

const makeVar = (kind: string, rawVal: any, objectId?: string, declaredType: string = 'int'): VariableView => ({
  name: 'testVar',
  declaredType,
  scope: 'local',
  changed: false,
  value: {
    kind,
    value: rawVal,
    valueString: String(rawVal),
    objectId,
  },
})

describe('formatVariableValue', () => {
  it('should format primitive numbers (int, long, float, double, etc.) without string errors', () => {
    expect(formatVariableValue(makeVar('int', 5))).toBe('5')
    expect(formatVariableValue(makeVar('int', 0))).toBe('0')
    expect(formatVariableValue(makeVar('long', 10000000000))).toBe('10000000000')
    expect(formatVariableValue(makeVar('float', 3.14))).toBe('3.14')
    expect(formatVariableValue(makeVar('double', 2.71828))).toBe('2.71828')
    expect(formatVariableValue(makeVar('byte', 127))).toBe('127')
    expect(formatVariableValue(makeVar('short', 32000))).toBe('32000')
  })

  it('should format boolean values', () => {
    expect(formatVariableValue(makeVar('boolean', true))).toBe('true')
    expect(formatVariableValue(makeVar('boolean', false))).toBe('false')
  })

  it('should format char values', () => {
    expect(formatVariableValue(makeVar('char', 'A'))).toBe("'A'")
    expect(formatVariableValue(makeVar('char', "'B'"))).toBe("'B'")
  })

  it('should format string values', () => {
    expect(formatVariableValue(makeVar('string', 'hello'))).toBe('"hello"')
    expect(formatVariableValue(makeVar('string', '"world"'))).toBe('"world"')
  })

  it('should format object and array references', () => {
    expect(formatVariableValue(makeVar('object_ref', null, 'obj_3'))).toBe('@obj_3')
    expect(formatVariableValue(makeVar('array_ref', null, 'obj_1'))).toBe('@obj_1')
    expect(formatVariableValue(makeVar('object_ref', '@obj_5'))).toBe('@obj_5')
  })

  it('should format null values', () => {
    expect(formatVariableValue(makeVar('null', null))).toBe('null')
  })
})
