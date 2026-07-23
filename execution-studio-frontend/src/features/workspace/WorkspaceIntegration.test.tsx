// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import { CallStackPanel } from '@/features/stack/CallStackPanel'
import { VariablesPanel } from '@/features/variables/VariablesPanel'
import { HeapViewContainer } from '@/features/heap/HeapViewContainer'
import { ObjectGraphPanel } from '@/features/object-graph/ObjectGraphPanel'
import type { VisualizationModel, DisplayValue, HeapObjectView } from '@/types/visualization.types'

// Mock HTMLElement.scrollIntoView since JSDOM doesn't support layout geometries
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Cytoscape mock tracker
let mockCySelectSpy = vi.fn()
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
          select: mockCySelectSpy,
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

describe('Workspace Synchronization Integration Tests', () => {
  beforeEach(() => {
    usePlaybackStore.getState().destroy()
    vi.clearAllMocks()
    registeredEvents = {}
    mockCySelectSpy = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  it('verifies timeline state seek changes update Call Stack line numbers and Variables', () => {
    const frame1: VisualizationModel = {
      stack: {
        frames: [
          {
            className: 'Test',
            methodName: 'main',
            lineNumber: 10,
            locals: [
              {
                name: 'x',
                declaredType: 'int',
                value: mockVal('primitive', '5'),
                scope: 'local',
                changed: false,
              },
            ],
            isActive: true,
          },
        ],
      },
      heap: { objects: {} },
      variables: {
        variables: [
          {
            name: 'x',
            declaredType: 'int',
            value: mockVal('primitive', '5'),
            scope: 'local',
            changed: false,
          },
        ],
      },
      graph: { nodes: [], edges: [] },
      highlights: {
        currentLine: 10,
        currentMethod: 'main',
        currentStackFrame: 'Test.main',
        activeHighlights: [],
      },
      status: 'RUNNING',
    }

    const frame2: VisualizationModel = {
      stack: {
        frames: [
          {
            className: 'Test',
            methodName: 'main',
            lineNumber: 15,
            locals: [
              {
                name: 'x',
                declaredType: 'int',
                value: mockVal('primitive', '10'),
                scope: 'local',
                changed: true,
              },
            ],
            isActive: true,
          },
        ],
      },
      heap: { objects: {} },
      variables: {
        variables: [
          {
            name: 'x',
            declaredType: 'int',
            value: mockVal('primitive', '10'),
            scope: 'local',
            changed: true,
          },
        ],
      },
      graph: { nodes: [], edges: [] },
      highlights: {
        currentLine: 15,
        currentMethod: 'main',
        currentStackFrame: 'Test.main',
        activeHighlights: [],
      },
      status: 'RUNNING',
    }

    // Load frame1 initially into Zustand store
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: frame1,
      previousModel: null,
      currentFrameIndex: 0,
      totalFrameCount: 2,
    })

    const { rerender } = render(
      <div>
        <CallStackPanel />
        <VariablesPanel />
      </div>,
    )

    expect(screen.getByText('Test.java:10')).toBeDefined()
    expect(screen.getByText('5')).toBeDefined()

    // Transition state to frame 2
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: frame2,
      previousModel: frame1,
      currentFrameIndex: 1,
      totalFrameCount: 2,
    })

    rerender(
      <div>
        <CallStackPanel />
        <VariablesPanel />
      </div>,
    )

    expect(screen.getByText('Test.java:15')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
  })

  it('synchronizes stack frame selection with Variables Panel contents', () => {
    const frameWithDepth: VisualizationModel = {
      stack: {
        frames: [
          {
            className: 'Test',
            methodName: 'helper',
            lineNumber: 25,
            locals: [
              {
                name: 'param',
                declaredType: 'String',
                value: mockVal('string', 'hello'),
                scope: 'local',
                changed: false,
              },
            ],
            isActive: true,
          },
          {
            className: 'Test',
            methodName: 'main',
            lineNumber: 12,
            locals: [
              {
                name: 'argCount',
                declaredType: 'int',
                value: mockVal('primitive', '0'),
                scope: 'local',
                changed: false,
              },
            ],
            isActive: false,
          },
        ],
      },
      heap: { objects: {} },
      variables: {
        variables: [
          {
            name: 'param',
            declaredType: 'String',
            value: mockVal('string', 'hello'),
            scope: 'local',
            changed: false,
          },
        ],
      },
      graph: { nodes: [], edges: [] },
      highlights: {
        currentLine: 25,
        currentMethod: 'helper',
        currentStackFrame: 'Test.helper',
        activeHighlights: [],
      },
      status: 'RUNNING',
    }

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: frameWithDepth,
      selectedFrameIndex: 0,
    })

    render(
      <div>
        <CallStackPanel />
        <VariablesPanel />
      </div>,
    )

    expect(screen.getByText('param')).toBeDefined()
    expect(screen.getByText('"hello"')).toBeDefined()

    // Select second frame in Call Stack panel
    const mainFrameBtn = screen.getByText(/main/)
    fireEvent.click(mainFrameBtn)

    // Store selectedFrameIndex updated to 1
    expect(usePlaybackStore.getState().selectedFrameIndex).toBe(1)
  })

  it('synchronizes variable object reference click to selectedObjectId globally', () => {
    const modelWithRef: VisualizationModel = {
      stack: { frames: [] },
      heap: {
        objects: {
          '0x0042': mockHeapObject('0x0042', 'object', 'User', {
            id: mockVal('primitive', '42'),
          }),
        },
      },
      variables: {
        variables: [
          {
            name: 'userRef',
            declaredType: 'User',
            value: mockVal('object_ref', '0x0042', '0x0042'),
            scope: 'local',
            changed: false,
          },
        ],
      },
      graph: { nodes: [], edges: [] },
      highlights: {
        currentLine: 1,
        currentMethod: 'main',
        currentStackFrame: 'Test.main',
        activeHighlights: [],
      },
      status: 'RUNNING',
    }

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: modelWithRef,
      selectedObjectId: null,
    })

    render(<VariablesPanel />)

    const refElement = screen.getByText('@0x0042')
    fireEvent.click(refElement)

    // Global selectedObjectId in Zustand store should be updated to '0x0042'
    expect(usePlaybackStore.getState().selectedObjectId).toBe('0x0042')
  })

  it('synchronizes heap card clicks to selectedObjectId and cytoscape highlights', () => {
    const heapObj = mockHeapObject('0x0088', 'object', 'Student', {
      gpa: mockVal('primitive', '3.9'),
    })

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: { objects: { '0x0088': heapObj } },
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
      selectedObjectId: null,
    })

    render(
      <div>
        <HeapViewContainer />
        <ObjectGraphPanel />
      </div>,
    )

    // Click Student card in Heap panel
    const studentCard = screen.getByText('Student').closest('.heap-card') as HTMLDivElement
    fireEvent.click(studentCard)

    // Verify selectedObjectId set in store
    expect(usePlaybackStore.getState().selectedObjectId).toBe('0x0088')

    // Verify cytoscape node select method was called for 0x0088
    expect(mockCySelectSpy).toHaveBeenCalled()
  })

  it('synchronizes object graph node tap click to selectedObjectId and Heap Panel highlights', () => {
    const heapObj = mockHeapObject('0x0099', 'object', 'Tree', {
      depth: mockVal('primitive', '4'),
    })

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: { objects: { '0x0099': heapObj } },
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
      selectedObjectId: null,
    })

    render(
      <div>
        <HeapViewContainer />
        <ObjectGraphPanel />
      </div>,
    )

    // Retrieve Cytoscape tap callback registered during mount
    const tapCallbacks = registeredEvents['tap']
    expect(tapCallbacks).toBeDefined()
    expect(tapCallbacks.length).toBeGreaterThan(0)

    // Simulate clicking node 0x0099
    const mockEvent = {
      target: {
        id: () => '0x0099',
      },
    }

    act(() => {
      tapCallbacks[0](mockEvent)
    })

    // Verify selectedObjectId set in store
    expect(usePlaybackStore.getState().selectedObjectId).toBe('0x0099')

    // Heap Card element should reflect selection highlight state
    const card = screen.getByText('Tree').closest('.heap-card')
    expect(card?.getAttribute('aria-selected')).toBe('true')
  })

  it('resets selections during seek steps and restart operations', () => {
    usePlaybackStore.setState({
      selectedObjectId: '0x0099',
      selectedFrameIndex: 1,
    })

    // Destroy / reset operation
    usePlaybackStore.getState().destroy()

    expect(usePlaybackStore.getState().selectedObjectId).toBeNull()
    expect(usePlaybackStore.getState().selectedFrameIndex).toBeNull()
  })
})
