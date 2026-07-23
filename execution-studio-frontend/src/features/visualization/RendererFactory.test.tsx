// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { getRendererType } from './RendererFactory'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'

const refVal = (objectId: string): DisplayValue => ({
  kind: 'object_ref',
  objectId,
  valueString: objectId,
  value: objectId,
})

const nullVal = (): DisplayValue => ({ kind: 'null', valueString: 'null', value: 'null' })

const intVal = (n: number): DisplayValue => ({ kind: 'int', valueString: String(n), value: n })

const strVal = (s: string): DisplayValue => ({ kind: 'string', valueString: s, value: s })

const makeObj = (
  objectId: string,
  type: 'object' | 'array',
  classNameOrType: string,
  fields: Record<string, DisplayValue> = {},
): HeapObjectView => ({ objectId, type, classNameOrType, fieldsOrElements: fields })

describe('RendererFactory — getRendererType', () => {
  it('classifies int[] as ARRAY', () => {
    const obj = makeObj('arr_1', 'array', 'int[]', {
      '0': intVal(10),
      '1': intVal(20),
    })
    expect(getRendererType(obj)).toBe('ARRAY')
  })

  it('classifies String[] as ARRAY', () => {
    const obj = makeObj('arr_2', 'array', 'String[]', {
      '0': strVal('Volvo'),
      '1': strVal('BMW'),
    })
    expect(getRendererType(obj)).toBe('ARRAY')
  })

  it('classifies Node with next field as LINKED_LIST', () => {
    const obj = makeObj('n1', 'object', 'Node', {
      data: intVal(10),
      next: refVal('n2'),
    })
    expect(getRendererType(obj)).toBe('LINKED_LIST')
  })

  it('classifies DoublyNode with next+prev as LINKED_LIST', () => {
    const obj = makeObj('n1', 'object', 'DoublyNode', {
      data: intVal(10),
      next: refVal('n2'),
      prev: nullVal(),
    })
    expect(getRendererType(obj)).toBe('LINKED_LIST')
  })

  it('classifies TreeNode with left+right as BINARY_TREE', () => {
    const obj = makeObj('t1', 'object', 'TreeNode', {
      val: intVal(50),
      left: refVal('t2'),
      right: refVal('t3'),
    })
    expect(getRendererType(obj)).toBe('BINARY_TREE')
  })

  it('classifies general POJO as OBJECT', () => {
    const obj = makeObj('p1', 'object', 'Person', {
      name: strVal('Alice'),
      age: intVal(25),
    })
    expect(getRendererType(obj)).toBe('OBJECT')
  })

  it('classifies Stack class as STACK', () => {
    const obj = makeObj('s1', 'object', 'MyStack', {
      top: intVal(3),
    })
    expect(getRendererType(obj)).toBe('STACK')
  })

  it('classifies Queue class as QUEUE', () => {
    const obj = makeObj('q1', 'object', 'Queue', {
      front: intVal(0),
      size: intVal(3),
    })
    expect(getRendererType(obj)).toBe('QUEUE')
  })
})
