import { describe, it, expect } from 'vitest'
import { transformToEducationalTimeline, type RawTraceEvent } from './transformToEducationalTimeline'
import { usePlaybackStore } from '@/store/usePlaybackStore'

describe('Bug Fix Milestone — Pre-Execution State Alignment & Store Reset', () => {
  it('Bug 1: Highlighted line represents line about to execute; effects appear on next step', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 5, // int a = 5;
        callStack: [{ className: 'Main', methodName: 'main', lineNumber: 5, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 6, // int b = 10;
        callStack: [
          {
            className: 'Main',
            methodName: 'main',
            lineNumber: 6,
            locals: [{ name: 'a', type: 'int', value: { kind: 'int', value: 5, valueString: '5' } }],
          },
        ],
      },
      {
        sequence: 3,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 7, // int c = a + b;
        callStack: [
          {
            className: 'Main',
            methodName: 'main',
            lineNumber: 7,
            locals: [
              { name: 'a', type: 'int', value: { kind: 'int', value: 5, valueString: '5' } },
              { name: 'b', type: 'int', value: { kind: 'int', value: 10, valueString: '10' } },
            ],
          },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(3)

    // Step 1: Highlight line 5 (int a = 5;). 'a' does NOT exist yet.
    expect(steps[0].highlightedLine).toBe(5)
    expect(steps[0].visualizationState.variables.variables).toHaveLength(0)

    // Step 2: Highlight line 6 (int b = 10;). 'a' appears. 'b' does NOT exist yet.
    expect(steps[1].highlightedLine).toBe(6)
    expect(steps[1].visualizationState.variables.variables).toHaveLength(1)
    expect(steps[1].visualizationState.variables.variables[0].name).toBe('a')

    // Step 3: Highlight line 7 (int c = a + b;). 'a' and 'b' appear. 'c' does NOT exist yet.
    expect(steps[2].highlightedLine).toBe(7)
    expect(steps[2].visualizationState.variables.variables).toHaveLength(2)
    expect(steps[2].visualizationState.variables.variables[0].name).toBe('a')
    expect(steps[2].visualizationState.variables.variables[1].name).toBe('b')
  })

  it('Bug 2: resetStore clears console stream, diagnostics, exceptions, and playback state completely', () => {
    // Populate store with simulated failed execution state (Run A)
    usePlaybackStore.setState({
      executionId: 'failed-run-1',
      status: 'FAILED',
      consoleStream: [{ type: 'stderr', text: 'Compilation error: semicolon expected\n' }],
      currentModel: {
        stack: { frames: [] },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: { currentLine: 1, currentMethod: 'main', currentStackFrame: 'main', activeHighlights: [] },
        status: 'EXCEPTION',
        compilationDiagnostics: [
          { severity: 'ERROR', file: 'Main.java', line: 5, column: 12, message: 'Semicolon expected' },
        ],
      },
      error: 'Compilation failed',
    })

    expect(usePlaybackStore.getState().consoleStream).toHaveLength(1)
    expect(usePlaybackStore.getState().currentModel?.compilationDiagnostics).toHaveLength(1)

    // Reset store before new execution (Run B)
    usePlaybackStore.getState().resetStore()

    // Verify completely clean state
    expect(usePlaybackStore.getState().executionId).toBeNull()
    expect(usePlaybackStore.getState().consoleStream).toHaveLength(0)
    expect(usePlaybackStore.getState().currentModel).toBeNull()
    expect(usePlaybackStore.getState().error).toBeNull()
    expect(usePlaybackStore.getState().educationalTimeline).toHaveLength(0)
  })
})
