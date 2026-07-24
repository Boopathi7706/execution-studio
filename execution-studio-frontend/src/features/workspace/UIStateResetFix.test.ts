import { describe, it, expect } from 'vitest'
import { useAppStore } from '@/store/useAppStore'
import { usePlaybackStore } from '@/store/usePlaybackStore'

describe('UI State Reset Fix — Execution Independence Verification', () => {
  it('Scenario 1: Clears globalError, compiler diagnostics, and console output before starting a new execution', () => {
    // Populate state from a failed compilation (Run A)
    useAppStore.setState({
      globalError: 'Compilation error: semicolon expected',
      currentExecutionId: 'exec-fail-1',
      executionStatus: 'FAILED',
    })

    usePlaybackStore.setState({
      executionId: 'exec-fail-1',
      status: 'FAILED',
      consoleStream: [{ type: 'stderr', text: 'Main.java:5: error: ; expected\n' }],
      currentModel: {
        stack: { frames: [] },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: { currentLine: 5, currentMethod: 'main', currentStackFrame: 'main', activeHighlights: [] },
        status: 'EXCEPTION',
        compilationDiagnostics: [
          { severity: 'ERROR', file: 'Main.java', line: 5, column: 10, message: 'Semicolon expected' },
        ],
      },
      error: 'Compilation failed',
    })

    expect(useAppStore.getState().globalError).toBe('Compilation error: semicolon expected')
    expect(usePlaybackStore.getState().consoleStream).toHaveLength(1)
    expect(usePlaybackStore.getState().currentModel?.compilationDiagnostics).toHaveLength(1)

    // User presses Run (Run B)
    useAppStore.getState().resetExecutionState()
    usePlaybackStore.getState().resetStore()

    // Verify all execution UI state is completely clean before Run B populates
    expect(useAppStore.getState().globalError).toBeNull()
    expect(useAppStore.getState().currentExecutionId).toBeNull()
    expect(useAppStore.getState().executionStatus).toBeNull()

    expect(usePlaybackStore.getState().consoleStream).toHaveLength(0)
    expect(usePlaybackStore.getState().currentModel).toBeNull()
    expect(usePlaybackStore.getState().error).toBeNull()
    expect(usePlaybackStore.getState().executionId).toBeNull()
  })

  it('Scenario 2: Clears runtime exceptions and exception banners when a new run begins', () => {
    // Populate state from a runtime exception (Run A)
    usePlaybackStore.setState({
      executionId: 'exec-npe-1',
      status: 'EXCEPTION',
      consoleStream: [{ type: 'stderr', text: 'Exception in thread "main" java.lang.NullPointerException\n' }],
      currentModel: {
        stack: { frames: [] },
        heap: { objects: {} },
        variables: { variables: [] },
        graph: { nodes: [], edges: [] },
        highlights: { currentLine: 12, currentMethod: 'main', currentStackFrame: 'main', activeHighlights: [] },
        status: 'EXCEPTION',
        exceptionInfo: {
          exceptionType: 'java.lang.NullPointerException',
          exceptionMessage: 'Cannot invoke method on null',
          lineNumber: 12,
        },
      },
    })

    expect(usePlaybackStore.getState().currentModel?.exceptionInfo).toBeDefined()

    // User presses Run for valid program (Run B)
    useAppStore.getState().resetExecutionState()
    usePlaybackStore.getState().resetStore()

    // Verify runtime exception and console state are cleared
    expect(usePlaybackStore.getState().currentModel).toBeNull()
    expect(usePlaybackStore.getState().consoleStream).toHaveLength(0)
    expect(usePlaybackStore.getState().error).toBeNull()
  })
})
