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

// Setup a complex debug scenario model
const getMockModel = (stepIndex: number): VisualizationModel => {
  return {
    stack: {
      frames: [
        {
          className: 'com.studio.Calculator',
          methodName: 'add',
          lineNumber: 10 + stepIndex,
          isActive: true,
          locals: [
            {
              name: 'x',
              declaredType: 'int',
              scope: 'parameter',
              value: mockVal('primitive', `${5 + stepIndex}`),
              changed: false,
            },
            {
              name: 'resultHolder',
              declaredType: 'com.studio.Result',
              scope: 'local',
              value: mockVal('object_ref', '0x00A1', '0x00A1'),
              changed: stepIndex > 0,
            },
          ],
        },
        {
          className: 'com.studio.Main',
          methodName: 'main',
          lineNumber: 4,
          isActive: false,
          locals: [
            {
              name: 'calculator',
              declaredType: 'com.studio.Calculator',
              scope: 'local',
              value: mockVal('object_ref', '0x00B5', '0x00B5'),
              changed: false,
            },
          ],
        },
      ],
    },
    heap: {
      objects: {
        '0x00A1': mockHeapObject('0x00A1', 'object', 'com.studio.Result', {
          val: mockVal('primitive', `${10 + stepIndex}`),
        }),
        '0x00B5': mockHeapObject('0x00B5', 'object', 'com.studio.Calculator', {}),
      },
    },
    variables: { variables: [] },
    graph: { nodes: [], edges: [] },
    highlights: {
      currentLine: 10 + stepIndex,
      currentMethod: 'add',
      currentStackFrame: 'com.studio.Calculator.add',
      activeHighlights: [],
    },
    status: 'RUNNING',
  }
}

describe('Workspace Synchronization Integration Tests', () => {
  beforeEach(() => {
    usePlaybackStore.getState().destroy()
    vi.clearAllMocks()
    mockCySelectSpy = vi.fn()
    registeredEvents = {}
  })

  afterEach(() => {
    cleanup()
  })

  it('verifies timeline state seek changes update Call Stack line numbers and Variables', () => {
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: getMockModel(0),
      metadata: {
        currentStepIndex: 0,
        totalSteps: 5,
        progressPercentage: 0,
      },
    })

    const { rerender } = render(<CallStackPanel />)
    expect(screen.getByText('Calculator.java:10')).toBeDefined()

    // Step to index 2
    act(() => {
      usePlaybackStore.setState({
        currentModel: getMockModel(2),
        metadata: {
          ...usePlaybackStore.getState().metadata!,
          currentStepIndex: 2,
          progressPercentage: 50,
        },
      })
    })

    rerender(<CallStackPanel />)
    expect(screen.getByText('Calculator.java:12')).toBeDefined()
  })

  it('synchronizes stack frame selection with Variables Panel contents', () => {
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: getMockModel(0),
    })

    render(
      <div>
        <CallStackPanel />
        <VariablesPanel />
      </div>,
    )

    // Initially displays variables of top active frame: Calculator.add() -> parameter 'x'
    expect(screen.getByText('x')).toBeDefined()
    expect(screen.queryByText('calculator')).toBeNull()

    // Click lower stack frame Card: com.studio.Main.main()
    const mainFrameCard = screen.getByText('main()')
    act(() => {
      fireEvent.click(mainFrameCard)
    })

    // Variables Panel should swap contents to display Main.main() scope -> parameter 'calculator'
    expect(screen.queryByText('x')).toBeNull()
    expect(screen.getByText('calculator')).toBeDefined()
  })

  it('synchronizes variable object reference click to selectedObjectId globally', () => {
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: getMockModel(0),
    })

    render(<VariablesPanel />)

    // Click on local variable 'resultHolder' reference to trigger selection
    const resultHolderRow = screen.getByText('resultHolder')
    act(() => {
      fireEvent.click(resultHolderRow)
    })

    // Selected object ID should update globally
    expect(usePlaybackStore.getState().selectedObjectId).toBe('0x00A1')
  })

  it('synchronizes heap card clicks to selectedObjectId and cytoscape highlights', () => {
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: getMockModel(0),
    })

    render(
      <div>
        <HeapViewContainer />
        <ObjectGraphPanel />
      </div>,
    )

    // Select Heap tab
    const cardsTab = screen.getByText('Heap Elements Card List')
    act(() => {
      fireEvent.click(cardsTab)
    })

    // Heap Card for resultHolder '@0x00A1' should render
    const resultCardHeader = screen.getByText('@0x00A1')
    act(() => {
      fireEvent.click(resultCardHeader)
    })

    // Global selected object ID updates
    expect(usePlaybackStore.getState().selectedObjectId).toBe('0x00A1')

    // Cytoscape component receives selection update hook
    expect(mockCySelectSpy).toHaveBeenCalled()
  })

  it('synchronizes object graph node tap click to selectedObjectId and Heap Panel highlights', () => {
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: getMockModel(0),
    })

    render(
      <div>
        <HeapViewContainer />
        <ObjectGraphPanel />
      </div>,
    )

    const graphTab = screen.getByText('Object Reference Graph')
    act(() => {
      fireEvent.click(graphTab)
    })

    // Retrieve tap callback from cytoscape event registry
    const tapCallbacks = registeredEvents['tap']
    expect(tapCallbacks).toBeDefined()
    expect(tapCallbacks.length).toBeGreaterThan(0)

    // Simulate clicking node 0x00B5
    const mockEvent = {
      target: {
        id: () => '0x00B5',
      },
    }

    act(() => {
      tapCallbacks[0](mockEvent)
    })

    // Check store updates
    expect(usePlaybackStore.getState().selectedObjectId).toBe('0x00B5')

    // Go back to Heap cards tab
    const cardsTab = screen.getByText('Heap Elements Card List')
    act(() => {
      fireEvent.click(cardsTab)
    })

    // Card matching 0x00B5 should have highlight attributes
    const cardB5 = screen.getByText('@0x00B5').closest('.heap-card')
    expect(cardB5?.getAttribute('aria-selected')).toBe('true')
  })

  it('resets selections during seek steps and restart operations', () => {
    usePlaybackStore.setState({
      sessionId: 'test-session',
      connectionStatus: 'CONNECTED',
      currentModel: getMockModel(0),
      selectedFrameIndex: 1,
      selectedObjectId: '0x00A1',
      metadata: {
        currentStepIndex: 0,
        totalSteps: 5,
        progressPercentage: 0,
      },
    })

    // Simulate seek or step forward setting new state
    act(() => {
      usePlaybackStore.getState().setSelectedFrameIndex(1)
      usePlaybackStore.getState().setSelectedObjectId('0x00A1')
    })

    expect(usePlaybackStore.getState().selectedFrameIndex).toBe(1)
    expect(usePlaybackStore.getState().selectedObjectId).toBe('0x00A1')

    // Execute seek to index 1
    act(() => {
      // populate cache mock for instant seek transitions
      usePlaybackStore.getState().cache[1] = getMockModel(1)
      usePlaybackStore.getState().seek(1)
    })

    // Frame selection and object selection resets to default index
    expect(usePlaybackStore.getState().selectedFrameIndex).toBeNull()
    expect(usePlaybackStore.getState().selectedObjectId).toBeNull()
  })
})
