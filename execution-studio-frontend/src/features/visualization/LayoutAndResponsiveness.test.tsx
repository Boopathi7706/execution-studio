// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { TimelinePanel } from '@/features/timeline/TimelinePanel'
import { ArrayRenderer } from './ArrayRenderer'
import { LinkedListRenderer } from './LinkedListRenderer'
import { MemoryVisualizationCanvas } from './MemoryVisualizationCanvas'
import { usePlaybackStore } from '@/store/usePlaybackStore'

describe('V5 Phase 1 — Responsive Workspace & Layout Stabilization Verification', () => {
  beforeEach(() => {
    usePlaybackStore.setState({
      connectionStatus: 'CONNECTED',
      metadata: {
        currentStepIndex: 0,
        totalSteps: 5,
        progressPercentage: 20,
      },
      isPlaying: false,
      timeline: [],
      currentModel: {
        stack: { frames: [{ className: 'Main', methodName: 'main', lineNumber: 5, locals: [], isActive: true }] },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: { currentLine: 5, currentMethod: 'main', currentStackFrame: 'Main.main', activeHighlights: [] },
        status: 'RUNNING',
      },
    })
  })

  it('1. TimelinePanel renders all primary and secondary controls with flex-wrap', () => {
    render(<TimelinePanel />)

    // Primary controls must be accessible
    expect(screen.getByLabelText(/Step Backward/i)).toBeDefined()
    expect(screen.getByLabelText(/Play/i)).toBeDefined()
    expect(screen.getByLabelText(/Step Forward/i)).toBeDefined()

    // Secondary controls must be present
    expect(screen.getByLabelText(/First Frame/i)).toBeDefined()
    expect(screen.getByLabelText(/Last Frame/i)).toBeDefined()
    expect(screen.getByLabelText(/Restart/i)).toBeDefined()
    expect(screen.getByLabelText(/Stop/i)).toBeDefined()
  })

  it('2. ArrayRenderer uses fit-content container sizing for small arrays', () => {
    const smallArrayObj = {
      objectId: 'arr_1',
      type: 'array' as const,
      classNameOrType: 'int[]',
      fieldsOrElements: {
        '0': { kind: 'int', value: 1, valueString: '1' },
        '1': { kind: 'int', value: 2, valueString: '2' },
        '2': { kind: 'int', value: 3, valueString: '3' },
      },
    }

    const { container } = render(
      <ArrayRenderer obj={smallArrayObj} variableLabels={['arr']} />
    )

    const outerCard = container.querySelector('#heap-obj-arr_1') as HTMLElement
    expect(outerCard).not.toBeNull()
    expect(outerCard.style.width).toBe('fit-content')
    expect(outerCard.style.maxWidth).toBe('100%')
  })

  it('3. LinkedListRenderer maintains a single horizontal chain (flexWrap: nowrap)', () => {
    const listObjects = {
      n1: {
        objectId: 'n1',
        type: 'object' as const,
        classNameOrType: 'Node',
        fieldsOrElements: {
          val: { kind: 'int', value: 10, valueString: '10' },
          next: { kind: 'object_ref', objectId: 'n2', valueString: 'n2' },
        },
      },
      n2: {
        objectId: 'n2',
        type: 'object' as const,
        classNameOrType: 'Node',
        fieldsOrElements: {
          val: { kind: 'int', value: 20, valueString: '20' },
          next: { kind: 'null', valueString: 'null' },
        },
      },
    }

    const { container } = render(
      <LinkedListRenderer objects={listObjects} headObjectId="n1" variableLabels={['head']} />
    )

    const chainContainer = container.querySelector('div[style*="flex-wrap: nowrap"]') as HTMLElement
    expect(chainContainer).not.toBeNull()
    expect(chainContainer.style.width).toBe('max-content')
  })

  it('4. MemoryVisualizationCanvas provides unified overflow auto for both x and y', () => {
    const heapObjects = {
      obj_1: {
        objectId: 'obj_1',
        type: 'object' as const,
        classNameOrType: 'Student',
        fieldsOrElements: { id: { kind: 'int', value: 101, valueString: '101' } },
      },
    }

    const { container } = render(
      <MemoryVisualizationCanvas
        objects={heapObjects}
        prevObjects={{}}
        variables={[]}
        selectedObjectId={null}
        onObjectClick={() => {}}
      />
    )

    const canvas = container.querySelector('.memory-visualization-canvas') as HTMLElement
    expect(canvas).not.toBeNull()
    expect(canvas.style.overflow).toBe('auto')
  })
})
