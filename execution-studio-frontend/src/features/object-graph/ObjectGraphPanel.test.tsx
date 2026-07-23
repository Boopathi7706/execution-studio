// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { ObjectGraphPanel } from './ObjectGraphPanel'
import { GraphBuilder } from './GraphBuilder'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { HeapObjectView, DisplayValue } from '@/types/visualization.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let registeredEvents: Record<string, ((...args: any[]) => any)[]> = {}

vi.mock('cytoscape', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        on: (event: string, selectorOrFn: any, fn?: (...args: any[]) => any) => {
          const callback = fn || selectorOrFn
          if (!registeredEvents[event]) registeredEvents[event] = []
          registeredEvents[event].push(callback)
        },
        getElementById: (id: string) => ({
          select: vi.fn(),
          id: () => id,
          length: 1,
        }),
        nodes: () => ({
          unselect: vi.fn(),
        }),
        animate: vi.fn(),
        center: vi.fn(),
        destroy: vi.fn(),
      }
    }),
  }
})

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
    registeredEvents = {}
  })

  afterEach(() => {
    cleanup()
  })

  it('renders graph placeholder when disconnected or empty heap', () => {
    usePlaybackStore.setState({ connectionStatus: 'DISCONNECTED', currentModel: null })

    const { rerender } = render(<ObjectGraphPanel />)
    expect(screen.getByText('No graph nodes available.')).toBeDefined()

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: { objects: {} },
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

    rerender(<ObjectGraphPanel />)
    expect(screen.getByText('No graph nodes available.')).toBeDefined()
  })

  it('GraphBuilder maps objects to nodes and edges, filters primitives and nulls', () => {
    const objects = {
      '0x0010': mockHeapObject('0x0010', 'object', 'Student', {
        age: mockVal('primitive', '20'),
        address: mockVal('object_ref', '0x0020', '0x0020'),
        guardian: mockVal('null', 'null'),
      }),
      '0x0020': mockHeapObject('0x0020', 'object', 'Address', {
        city: mockVal('string', 'Seattle'),
      }),
    }

    const { nodes, edges } = GraphBuilder.build(objects)

    expect(nodes.length).toBe(2)
    expect(nodes.find((n) => n.id === '0x0010')?.classNameOrType).toBe('Student')

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
    expect(edges.length).toBe(2)
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

    expect(screen.getByText('Select a node to inspect fields')).toBeDefined()

    const tapCallbacks = registeredEvents['tap']
    expect(tapCallbacks).toBeDefined()
    expect(tapCallbacks.length).toBeGreaterThan(0)

    const mockEvent = {
      target: {
        id: () => '0x0012',
      },
    }

    act(() => {
      tapCallbacks[0](mockEvent)
    })

    expect(screen.getByText('Student@0x0012')).toBeDefined()
    expect(screen.getByText('name')).toBeDefined()
    expect(screen.getByText('"Alice"')).toBeDefined()
  })

  it('GraphBuilder performs well on large heaps (1000+ objects, 2000+ reference edges)', () => {
    const objects: Record<string, HeapObjectView> = {}

    for (let i = 1; i <= 1000; i++) {
      const hex = i.toString(16).padStart(4, '0')
      const next1 = (i % 1000) + 1
      const hexNext1 = next1.toString(16).padStart(4, '0')

      objects[`0x${hex}`] = mockHeapObject(`0x${hex}`, 'object', 'HeapObj', {
        ref1: mockVal('object_ref', `0x${hexNext1}`, `0x${hexNext1}`),
      })
    }

    const { nodes, edges } = GraphBuilder.build(objects)

    expect(nodes.length).toBe(1000)
    expect(edges.length).toBe(1000)
  })
})
