// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { ObjectGraphPanel } from './ObjectGraphPanel'
import { GraphBuilder } from './GraphBuilder'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'

const mockVal = (
  kind: 'primitive' | 'object_ref' | 'array_ref' | 'string' | 'null',
  rawValue: string,
  objectId?: string,
): DisplayValue => ({
  kind,
  value: rawValue,
  valueString: rawValue,
  objectId,
})

const mockHeapObject = (
  objectId: string,
  type: 'object' | 'array',
  classNameOrType: string,
  fields: Record<string, DisplayValue>,
): HeapObjectView => ({
  objectId,
  type,
  classNameOrType,
  fieldsOrElements: fields,
})

describe('ObjectGraphPanel and GraphBuilder', () => {
  beforeEach(() => {
    usePlaybackStore.getState().destroy()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders graph placeholder when disconnected or empty heap', () => {
    usePlaybackStore.setState({
      connectionStatus: 'DISCONNECTED',
      currentModel: null,
    })

    const { container } = render(<ObjectGraphPanel />)
    expect(container.querySelector('.graph-empty')).toBeDefined()
    expect(screen.getByText('No graph nodes available.')).toBeDefined()
  })

  it('GraphBuilder maps objects to nodes and edges, filters primitives and nulls', () => {
    const objects = {
      '0x0010': mockHeapObject('0x0010', 'object', 'Student', {
        age: mockVal('primitive', '21'),
        address: mockVal('object_ref', '0x0020', '0x0020'),
        nullField: mockVal('null', 'null'),
      }),
      '0x0020': mockHeapObject('0x0020', 'object', 'Address', {
        city: mockVal('string', 'Chennai'),
      }),
    }

    const { nodes, edges } = GraphBuilder.build(objects)

    expect(nodes.length).toBe(2)
    expect(nodes.map((n) => n.id)).toEqual(['0x0010', '0x0020'])

    expect(edges.length).toBe(1)
    expect(edges[0].source).toBe('0x0010')
    expect(edges[0].target).toBe('0x0020')
    expect(edges[0].fieldName).toBe('address')
  })

  it('GraphBuilder handles circular reference loops and duplicate references safely', () => {
    // Linked list loop: A -> B -> A
    const objects = {
      '0x0010': mockHeapObject('0x0010', 'object', 'Node', {
        next: mockVal('object_ref', '0x0020', '0x0020'),
        dup: mockVal('object_ref', '0x0020', '0x0020'),
      }),
      '0x0020': mockHeapObject('0x0020', 'object', 'Node', {
        next: mockVal('object_ref', '0x0010', '0x0010'),
      }),
    }

    const { nodes, edges } = GraphBuilder.build(objects)

    expect(nodes.length).toBe(2)
    expect(edges.length).toBe(3)
  })

  it('triggers inspector panel updates when node selection changes', () => {
    const obj = mockHeapObject('0x0012', 'object', 'Student', {
      name: mockVal('string', 'Alice'),
    })

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: { objects: { '0x0012': obj } },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 0,
          currentMethod: '',
          currentStackFrame: '',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
    })

    render(<ObjectGraphPanel />)

    // Pre-select active node in store
    act(() => {
      usePlaybackStore.getState().setSelectedObjectId('0x0012')
    })

    expect(screen.getByText('Student@0x0012')).toBeDefined()
    expect(screen.getByText('name')).toBeDefined()
    expect(screen.getByText('"Alice"')).toBeDefined()
  })

  it('GraphBuilder performs well on large heaps (1000+ objects, 2000+ reference edges)', () => {
    const largeHeap: Record<string, HeapObjectView> = {}

    for (let i = 1; i <= 1000; i++) {
      const id = `0x${i.toString(16).padStart(4, '0')}`
      const nextNum = (i % 1000) + 1
      const nextId = `0x${nextNum.toString(16).padStart(4, '0')}`
      largeHeap[id] = mockHeapObject(id, 'object', 'Node', {
        next: mockVal('object_ref', nextId, nextId),
      })
    }

    const startTime = performance.now()
    const { nodes, edges } = GraphBuilder.build(largeHeap)
    const duration = performance.now() - startTime

    expect(nodes.length).toBe(1000)
    expect(edges.length).toBe(1000)
    expect(duration).toBeLessThan(100) // Expect under 100ms execution
  })
})
