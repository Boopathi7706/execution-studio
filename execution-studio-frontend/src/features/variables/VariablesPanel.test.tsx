// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { VariablesPanel } from './VariablesPanel'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { VariableView } from '@/types/visualization.types'

const mockVar = (
  name: string,
  declaredType: string,
  kind: 'primitive' | 'object_ref' | 'array_ref' | 'string' | 'null',
  rawValue: string,
  scope: 'local' | 'parameter' = 'local',
  changed: boolean = false,
  objectId?: string,
): VariableView => ({
  name,
  declaredType,
  value: {
    kind,
    value: rawValue,
    valueString: rawValue,
    objectId,
  },
  scope,
  changed,
})

describe('VariablesPanel Component', () => {
  beforeEach(() => {
    usePlaybackStore.getState().destroy()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders placeholder empty message when disconnected or variable listing is empty', () => {
    usePlaybackStore.setState({ connectionStatus: 'DISCONNECTED', currentModel: null })

    const { rerender } = render(<VariablesPanel />)
    expect(screen.getByText('No variables available.')).toBeDefined()

    // Connected but empty locals listing
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: {
          frames: [
            {
              className: 'com.executionstudio.Sample',
              methodName: 'main',
              lineNumber: 10,
              locals: [],
              isActive: true,
            },
          ],
        },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 10,
          currentMethod: 'main',
          currentStackFrame: 'Main',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
    })

    rerender(<VariablesPanel />)
    expect(screen.getByText('No variables available.')).toBeDefined()
  })

  it('renders primitives, strings, nulls, and reference values correctly', () => {
    const vars = [
      mockVar('count', 'int', 'primitive', '15', 'local'),
      mockVar('name', 'String', 'string', 'Alice', 'local'),
      mockVar('student', 'Student', 'object_ref', 'Student@0x0012', 'local', false, '0x0012'),
      mockVar('numbers', 'int[]', 'array_ref', 'length=10', 'local'),
      mockVar('list', 'ArrayList', 'object_ref', 'size=5', 'local'),
      mockVar('flag', 'boolean', 'primitive', 'true', 'parameter'),
      mockVar('obj', 'Object', 'null', 'null', 'local'),
    ]

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: {
          frames: [
            {
              className: 'com.executionstudio.Sample',
              methodName: 'main',
              lineNumber: 10,
              locals: vars,
              isActive: true,
            },
          ],
        },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 10,
          currentMethod: 'main',
          currentStackFrame: 'Main',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
    })

    render(<VariablesPanel />)

    // Verify Row cells structure renders cleanly
    expect(screen.getByText('count')).toBeDefined()
    expect(screen.getByText('15')).toBeDefined()

    expect(screen.getByText('name')).toBeDefined()
    expect(screen.getByText('"Alice"')).toBeDefined()

    expect(screen.getByText('student')).toBeDefined()
    expect(screen.getByText('Student @0x0012')).toBeDefined()

    expect(screen.getByText('numbers')).toBeDefined()

    expect(screen.getByText('list')).toBeDefined()
    expect(screen.getByText('ArrayList(size=5)')).toBeDefined()

    expect(screen.getByText('flag')).toBeDefined()
    expect(screen.getByText('parameter')).toBeDefined()
    expect(screen.getByText('true')).toBeDefined()

    expect(screen.getByText('obj')).toBeDefined()
    expect(screen.getByText('null')).toBeDefined()
  })

  it('triggers flash animation when variable changes values', () => {
    // 1. Initial render with unchanged count
    const varUnchanged = mockVar('count', 'int', 'primitive', '10', 'local', false)
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: {
          frames: [
            {
              className: 'Sample',
              methodName: 'main',
              lineNumber: 10,
              locals: [varUnchanged],
              isActive: true,
            },
          ],
        },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 10,
          currentMethod: 'main',
          currentStackFrame: 'Main',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
    })

    const { container, rerender } = render(<VariablesPanel />)

    // Verify row does NOT have flash class
    const tr = container.querySelector('tbody tr') as HTMLTableRowElement
    expect(tr.classList.contains('variable-row-flash')).toBe(false)

    // 2. Rerender with changed count variable marked changed=true
    const varChanged = mockVar('count', 'int', 'primitive', '11', 'local', true)
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: {
          frames: [
            {
              className: 'Sample',
              methodName: 'main',
              lineNumber: 11,
              locals: [varChanged],
              isActive: true,
            },
          ],
        },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 11,
          currentMethod: 'main',
          currentStackFrame: 'Main',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
    })

    rerender(<VariablesPanel />)

    // Row should have flash class applied
    expect(tr.classList.contains('variable-row-flash')).toBe(true)

    // Advance fake timer by 1s wrapped in act
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Flash class should be removed
    expect(tr.classList.contains('variable-row-flash')).toBe(false)
  })

  it('performs well rendering large lists of variables (500+ items)', () => {
    const vars: VariableView[] = []
    for (let i = 0; i < 520; i++) {
      vars.push(mockVar(`var_${i}`, 'int', 'primitive', String(i), 'local'))
    }

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: {
          frames: [
            {
              className: 'Sample',
              methodName: 'main',
              lineNumber: 10,
              locals: vars,
              isActive: true,
            },
          ],
        },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 10,
          currentMethod: 'main',
          currentStackFrame: 'Main',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
    })

    render(<VariablesPanel />)

    // Expect start and end index items to be defined
    expect(screen.getByText('var_0')).toBeDefined()
    expect(screen.getByText('var_519')).toBeDefined()
  })
})
