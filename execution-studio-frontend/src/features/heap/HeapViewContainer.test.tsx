// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { HeapViewContainer } from './HeapViewContainer'
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

describe('HeapViewContainer Component', () => {
  beforeEach(() => {
    usePlaybackStore.getState().destroy()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders placeholder empty message when disconnected or heap list is empty', () => {
    usePlaybackStore.setState({
      connectionStatus: 'DISCONNECTED',
      currentModel: null,
    })

    const { container } = render(<HeapViewContainer />)
    expect(container.querySelector('.heap-empty')).toBeDefined()
    expect(screen.getByText('No heap objects allocated.')).toBeDefined()
  })

  it('renders primitives, strings, references, nulls, arrays and collections correctly', () => {
    const studentObj = mockHeapObject('0x0010', 'object', 'Student', {
      age: mockVal('primitive', '21'),
      name: mockVal('string', 'Alice'),
      advisor: mockVal('object_ref', '0x0011', '0x0011'),
      transcript: mockVal('null', 'null'),
    })

    const arrayObj = mockHeapObject('0x0020', 'array', 'int[]', {
      '[0]': mockVal('primitive', '100'),
      '[1]': mockVal('primitive', '200'),
    })

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: {
          objects: {
            '0x0010': studentObj,
            '0x0020': arrayObj,
          },
        },
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

    render(<HeapViewContainer />)

    expect(screen.getByText('Student')).toBeDefined()
    expect(screen.getByText('age')).toBeDefined()
    expect(screen.getByText('21')).toBeDefined()
    expect(screen.getByText('name')).toBeDefined()
    expect(screen.getByText('"Alice"')).toBeDefined()
    expect(screen.getByText('advisor')).toBeDefined()
    expect(screen.getAllByText('@0x0011').length).toBeGreaterThan(0)
    expect(screen.getByText('transcript')).toBeDefined()
    expect(screen.getByText('null')).toBeDefined()

    expect(screen.getByText('int[]')).toBeDefined()
    expect(screen.getByText('100')).toBeDefined()
    expect(screen.getByText('200')).toBeDefined()
  })

  it('highlights changed fields when transitioning step states', () => {
    const objUnchanged = mockHeapObject('0x0012', 'object', 'Student', {
      age: mockVal('primitive', '21'),
    })

    // Setup initial step state
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: { objects: { '0x0012': objUnchanged } },
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

    const { rerender } = render(<HeapViewContainer />)

    // Check no flashing has started
    const fieldRow = screen.getByText('age').closest('div') as HTMLDivElement
    expect(fieldRow.classList.contains('variable-row-flash')).toBe(false)

    // Update state where age value is modified (changed = true)
    const objChanged = mockHeapObject('0x0012', 'object', 'Student', {
      age: mockVal('primitive', '22'),
    })

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      previousModel: {
        stack: { frames: [] },
        heap: { objects: { '0x0012': objUnchanged } },
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
      currentModel: {
        stack: { frames: [] },
        heap: { objects: { '0x0012': objChanged } },
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

    rerender(<HeapViewContainer />)

    const updatedFieldRow = screen.getByText('age').closest('div') as HTMLDivElement

    // Row should have flash class
    expect(updatedFieldRow.classList.contains('variable-row-flash')).toBe(true)

    // Fast-forward fake timers by 1s
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Flash class removed
    expect(updatedFieldRow.classList.contains('variable-row-flash')).toBe(false)
  })

  it('safely handles circular references and loops without crashing', () => {
    // Setup mutual circular references (Node A points to Node B, Node B points to Node A)
    const fieldsA: Record<string, DisplayValue> = {
      next: mockVal('object_ref', '0x0020', '0x0020'),
    }

    const fieldsB: Record<string, DisplayValue> = {
      prev: mockVal('object_ref', '0x0010', '0x0010'),
    }

    const nodeA = mockHeapObject('0x0010', 'object', 'Node', fieldsA)
    const nodeB = mockHeapObject('0x0020', 'object', 'Node', fieldsB)

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: {
          objects: {
            '0x0010': nodeA,
            '0x0020': nodeB,
          },
        },
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

    render(<HeapViewContainer />)

    expect(screen.getAllByText('@0x0010').length).toBeGreaterThan(0)
    expect(screen.getAllByText('@0x0020').length).toBeGreaterThan(0)
  })

  it('renders large heaps (100+ objects) successfully', { timeout: 15000 }, () => {
    const largeHeap: Record<string, HeapObjectView> = {}

    for (let i = 0; i < 100; i++) {
      const id = `0x${i.toString(16).padStart(4, '0')}`
      largeHeap[id] = mockHeapObject(id, 'object', 'Node', {
        val: mockVal('primitive', String(i)),
      })
    }

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: { objects: largeHeap },
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

    render(<HeapViewContainer />)

    const renderedCards = screen.getAllByText('Node')
    expect(renderedCards.length).toBe(100)
  })
})
