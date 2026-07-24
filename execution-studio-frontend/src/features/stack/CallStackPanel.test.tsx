// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CallStackPanel } from './CallStackPanel'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { FrameView } from '@/types/visualization.types'

const mockFrame = (
  className: string,
  methodName: string,
  lineNumber: number,
  isActive: boolean = false,
): FrameView => ({
  className,
  methodName,
  lineNumber,
  locals: [],
  isActive,
})

describe('CallStackPanel Component', () => {
  beforeEach(() => {
    usePlaybackStore.getState().destroy()
    vi.clearAllMocks()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders placeholder empty message when disconnected or stack empty', () => {
    usePlaybackStore.setState({ connectionStatus: 'DISCONNECTED', currentModel: null })

    const { rerender } = render(<CallStackPanel />)
    expect(screen.getByText('No active execution stack')).toBeDefined()

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

    rerender(<CallStackPanel />)
    expect(screen.getByText('No active execution stack')).toBeDefined()
  })

  it('renders single frame with active indicators', () => {
    const frame = mockFrame('com.executionstudio.Sample', 'main', 12, true)
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [frame] },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 12,
          currentMethod: 'main',
          currentStackFrame: 'Main',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
    })

    render(<CallStackPanel />)

    expect(screen.getByText('main()')).toBeDefined()
    expect(screen.getByText('Line 12')).toBeDefined()
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('renders list of multiple frames ordered top-to-bottom', () => {
    const frames = [
      mockFrame('com.executionstudio.Calculator', 'add', 18, true),
      mockFrame('com.executionstudio.Calculator', 'calculate', 35),
      mockFrame('com.executionstudio.Sample', 'main', 12),
    ]

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 18,
          currentMethod: 'add',
          currentStackFrame: 'Add',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
    })

    render(<CallStackPanel />)

    expect(screen.getByText('add()')).toBeDefined()
    expect(screen.getByText('calculate()')).toBeDefined()
    expect(screen.getByText('main()')).toBeDefined()
    expect(screen.getByText('Line 18')).toBeDefined()
    expect(screen.getByText('Line 35')).toBeDefined()
    expect(screen.getByText('Line 12')).toBeDefined()
  })

  it('handles recursive calls cleanly using identical frame labels', () => {
    const frames = [
      mockFrame('com.executionstudio.Fibonacci', 'fib', 15, true),
      mockFrame('com.executionstudio.Fibonacci', 'fib', 15),
      mockFrame('com.executionstudio.Fibonacci', 'fib', 18),
    ]

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 15,
          currentMethod: 'fib',
          currentStackFrame: 'Fib',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
    })

    render(<CallStackPanel />)

    const fibElements = screen.getAllByText('fib()')
    expect(fibElements.length).toBe(3)
  })

  it('performs well on deep recursion stack frames (100+ items)', () => {
    const frames: FrameView[] = []
    for (let i = 0; i < 120; i++) {
      frames.push(mockFrame('com.executionstudio.DeepRecursion', 'recurse', i + 1, i === 0))
    }

    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 1,
          currentMethod: 'recurse',
          currentStackFrame: 'Recurse',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
    })

    render(<CallStackPanel />)

    expect(screen.getByText('Line 1')).toBeDefined()
    expect(screen.getByText('Line 120')).toBeDefined()
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
  }, 15000)
})
