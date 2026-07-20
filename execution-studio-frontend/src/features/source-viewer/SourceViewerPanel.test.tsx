// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { SourceViewerPanel } from './SourceViewerPanel'
import { usePlaybackStore } from '@/store/usePlaybackStore'
import type { PlaybackMetadata } from '@/types/metadata.types'

// Setup spies for Monaco Editor methods
const deltaDecorationsSpy = vi.fn().mockReturnValue(['decor-new'])
const revealLineSpy = vi.fn()
const getLineCountSpy = vi.fn().mockReturnValue(100)

// Mock @monaco-editor/react Editor component using capitalized React component name
vi.mock('@monaco-editor/react', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockEditor = ({ value, options, onMount }: any) => {
    React.useEffect(() => {
      const mockEditor = {
        deltaDecorations: deltaDecorationsSpy,
        revealLineInCenterIfOutsideViewport: revealLineSpy,
        getModel: () => ({ getLineCount: getLineCountSpy }),
      }
      const mockMonaco = {
        Range: class {
          constructor(
            public startLine: number,
            public startCol: number,
            public endLine: number,
            public endCol: number,
          ) {}
        },
      }
      if (onMount) {
        onMount(mockEditor, mockMonaco)
      }
    }, [onMount])

    return (
      <div data-testid="mock-monaco-editor">
        <pre>{value}</pre>
        <span data-testid="monaco-readonly">{options?.readOnly ? 'readonly' : 'editable'}</span>
        <span data-testid="monaco-minimap">
          {options?.minimap?.enabled ? 'minimap-on' : 'minimap-off'}
        </span>
      </div>
    )
  }

  return {
    default: MockEditor,
  }
})

const mockMetadata = (index: number, total: number = 100): PlaybackMetadata => ({
  currentStepIndex: index,
  totalSteps: total,
  progressPercentage: (index / (total - 1 || 1)) * 100,
})

describe('SourceViewerPanel and MonacoWrapper', () => {
  beforeEach(() => {
    usePlaybackStore.getState().destroy()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders read-only java editor options', () => {
    render(<SourceViewerPanel />)

    expect(screen.getByTestId('mock-monaco-editor')).toBeDefined()
    expect(screen.getByTestId('monaco-readonly').textContent).toBe('readonly')
    expect(screen.getByTestId('monaco-minimap').textContent).toBe('minimap-off')
  })

  it('highlights currently executing line on active session step change', () => {
    // 1. Load active session at step 0 (execution line 7)
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 7,
          currentMethod: 'main',
          currentStackFrame: 'Main',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
      metadata: mockMetadata(0),
    })

    render(<SourceViewerPanel />)

    // Verify Monaco deltaDecorations is called with active line 7
    expect(deltaDecorationsSpy).toHaveBeenCalledWith(
      [],
      [
        expect.objectContaining({
          options: expect.objectContaining({
            className: 'active-execution-line-highlight',
            glyphMarginClassName: 'active-execution-line-glyph',
          }),
        }),
      ],
    )
    // Verify auto-scrolling is called
    expect(revealLineSpy).toHaveBeenCalledWith(7)
  })

  it('safely handles empty source and out-of-bound invalid line numbers', () => {
    // 1. Render with a valid line (e.g. 5)
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 5,
          currentMethod: 'main',
          currentStackFrame: 'Main',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
      metadata: mockMetadata(0),
    })

    const { rerender } = render(<SourceViewerPanel />)

    // Verify it decorated line 5
    expect(deltaDecorationsSpy).toHaveBeenCalledWith([], expect.any(Array))
    deltaDecorationsSpy.mockClear()

    // 2. Transition to an out-of-bound line (e.g. 200)
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      currentModel: {
        stack: { frames: [] },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: {
          currentLine: 200,
          currentMethod: 'main',
          currentStackFrame: 'Main',
          activeHighlights: [],
        },
        status: 'RUNNING',
      },
      metadata: mockMetadata(0),
    })

    rerender(<SourceViewerPanel />)

    // Should call deltaDecorations to clear the old decoration ['decor-new'] with []
    expect(deltaDecorationsSpy).toHaveBeenCalledWith(['decor-new'], [])
  })
})
