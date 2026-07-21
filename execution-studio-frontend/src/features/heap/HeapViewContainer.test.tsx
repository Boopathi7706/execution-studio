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
    usePlaybackStore.setState({ connectionStatus: 'DISCONNECTED', currentModel: null })

    const { rerender } = render(<HeapViewContainer />)
    expect(screen.getByText('No heap objects allocated.')).toBeDefined()

    // Connected but empty heap objects
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

    rerender(<HeapViewContainer />)
    expect(screen.getByText('No heap objects allocated.')).toBeDefined()
  })

  it('renders primitives, strings, references, nulls, arrays and collections correctly', () => {
    const fields: Record<string, DisplayValue> = {
      age: mockVal('primitive', '21'),
      name: mockVal('string', 'Alice'),
      address: mockVal('object_ref', '0x0045', '0x0045'),
      college: mockVal('null', 'null'),
      marks: mockVal('array_ref', 'int[5]', '0x0090'),
      students: mockVal('object_ref', 'size=25', '0x0078'),
    }

    const obj = mockHeapObject('0x0012', 'object', 'Student', fields)

    // Set mock size-based class type for collection representation
    const collObj = mockHeapObject('0x0078', 'object', 'ArrayList', {
      size: mockVal('primitive', '25'),
    })

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: {
          objects: {
            '0x0012': obj,
            '0x0078': collObj,
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

    // Header asserts
    expect(screen.getByText('Student')).toBeDefined()
    expect(screen.getByText('@0x0012')).toBeDefined()

    // Field names and values asserts
    expect(screen.getByText('age')).toBeDefined()
    expect(screen.getByText('21')).toBeDefined()

    expect(screen.getByText('name')).toBeDefined()
    expect(screen.getByText('"Alice"')).toBeDefined()

    expect(screen.getByText('address')).toBeDefined()
    expect(screen.getByText('@0x0045')).toBeDefined()

    expect(screen.getByText('college')).toBeDefined()
    expect(screen.getAllByText('null').length).toBeGreaterThan(0)

    expect(screen.getByText('marks')).toBeDefined()

    expect(screen.getByText('students')).toBeDefined()
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

    const { container, rerender } = render(<HeapViewContainer />)

    // Check no flashing has started
    const fieldRow = container.querySelector('.heap-card div div') as HTMLDivElement
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

    // Row should have flash class
    expect(fieldRow.classList.contains('variable-row-flash')).toBe(true)

    // Fast-forward fake timers by 1s
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Flash class removed
    expect(fieldRow.classList.contains('variable-row-flash')).toBe(false)
  })

  it('safely handles circular references and loops without crashing', () => {
    // Setup mutual circular references (Node A points to Node B, Node B points to Node A)
    const fieldsA: Record<string, DisplayValue> = {
      next: mockVal('object_ref', '0x0020', '0x0020'),
    }
    const fieldsB: Record<string, DisplayValue> = {
      prev: mockVal('object_ref', '0x0010', '0x0010'),
    }

    const objA = mockHeapObject('0x0010', 'object', 'Node', fieldsA)
    const objB = mockHeapObject('0x0020', 'object', 'Node', fieldsB)

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: {
          objects: {
            '0x0010': objA,
            '0x0020': objB,
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

    // Renders cleanly without infinite loops
    expect(screen.getAllByText(/0x0010/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/0x0020/).length).toBeGreaterThan(0)
  })

  it('renders large heaps (1000+ objects) successfully', () => {
    const objects: Record<string, HeapObjectView> = {}
    for (let i = 0; i < 1010; i++) {
      const hex = i.toString(16).padStart(4, '0')
      objects[`0x${hex}`] = mockHeapObject(`0x${hex}`, 'object', 'HeapObj', {
        val: mockVal('primitive', String(i)),
      })
    }

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: { objects },
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

    // Render verification
    expect(screen.getByText('@0x0000')).toBeDefined()
    expect(screen.getByText('@0x03f1')).toBeDefined() // 1009 in hex
  }, 25000)
})
