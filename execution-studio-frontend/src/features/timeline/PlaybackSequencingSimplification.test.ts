import { describe, it, expect } from 'vitest'
import { transformToEducationalTimeline, type RawTraceEvent } from './transformToEducationalTimeline'

describe('Playback Sequencing Simplification — Universal Method Invocation Pacing', () => {
  it('Example 1: Student s = new Student("John") remains in main() on Step 1 before transitioning to Student() on Step 2', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: 'main',
        lineNumber: 10,
        callStack: [{ className: 'Student', methodName: 'main', lineNumber: 10, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: '<init>',
        lineNumber: 4,
        callStack: [
          { className: 'Student', methodName: '<init>', lineNumber: 4, locals: [] },
          { className: 'Student', methodName: 'main', lineNumber: 10, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(2)

    // Step 1: Highlight assignment line and remain inside caller context
    expect(steps[0].highlightedLine).toBe(10)
    expect(steps[0].highlightedMethod).toBe('main')
    expect(steps[0].visualizationState.stack.frames).toHaveLength(1)
    expect(steps[0].visualizationState.stack.frames[0].methodName).toBe('main')

    // Step 2: Transition into called constructor
    expect(steps[1].highlightedLine).toBe(4)
    expect(steps[1].highlightedMethod).toBe('Student')
    expect(steps[1].executionPhase).toBe('CONSTRUCTOR_ENTRY')
    expect(steps[1].visualizationState.stack.frames).toHaveLength(2)
  })

  it('Example 2: int result = add(3, 4) remains in main() on Step 1 before transitioning to add() on Step 2', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Calculator.java',
        className: 'Calculator',
        methodName: 'main',
        lineNumber: 8,
        callStack: [{ className: 'Calculator', methodName: 'main', lineNumber: 8, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Calculator.java',
        className: 'Calculator',
        methodName: 'add',
        lineNumber: 15,
        callStack: [
          { className: 'Calculator', methodName: 'add', lineNumber: 15, locals: [] },
          { className: 'Calculator', methodName: 'main', lineNumber: 8, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(2)

    // Step 1: Highlight calling line in main(), remain inside caller
    expect(steps[0].highlightedLine).toBe(8)
    expect(steps[0].highlightedMethod).toBe('main')
    expect(steps[0].visualizationState.stack.frames).toHaveLength(1)
    expect(steps[0].visualizationState.stack.frames[0].methodName).toBe('main')

    // Step 2: Transition into add() method
    expect(steps[1].highlightedLine).toBe(15)
    expect(steps[1].highlightedMethod).toBe('add')
    expect(steps[1].executionPhase).toBe('METHOD_ENTRY')
    expect(steps[1].visualizationState.stack.frames).toHaveLength(2)
  })

  it('Example 3: foo() remains in caller on Step 1 before entering foo() on Step 2', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'bar',
        lineNumber: 20,
        callStack: [{ className: 'Main', methodName: 'bar', lineNumber: 20, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'foo',
        lineNumber: 5,
        callStack: [
          { className: 'Main', methodName: 'foo', lineNumber: 5, locals: [] },
          { className: 'Main', methodName: 'bar', lineNumber: 20, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(2)

    // Step 1: Highlight foo() calling line in bar()
    expect(steps[0].highlightedLine).toBe(20)
    expect(steps[0].highlightedMethod).toBe('bar')
    expect(steps[0].visualizationState.stack.frames).toHaveLength(1)

    // Step 2: Enter foo()
    expect(steps[1].highlightedLine).toBe(5)
    expect(steps[1].highlightedMethod).toBe('foo')
    expect(steps[1].executionPhase).toBe('METHOD_ENTRY')
    expect(steps[1].visualizationState.stack.frames).toHaveLength(2)
  })

  it('Example 4: recursiveMethod() remains at depth N on Step 1 before transitioning to depth N+1 on Step 2', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Recursion.java',
        className: 'Recursion',
        methodName: 'factorial',
        lineNumber: 12,
        callStack: [{ className: 'Recursion', methodName: 'factorial', lineNumber: 12, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Recursion.java',
        className: 'Recursion',
        methodName: 'factorial',
        lineNumber: 5,
        callStack: [
          { className: 'Recursion', methodName: 'factorial', lineNumber: 5, locals: [] },
          { className: 'Recursion', methodName: 'factorial', lineNumber: 12, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(2)

    // Step 1: Highlight recursive call line in current frame (depth 1)
    expect(steps[0].highlightedLine).toBe(12)
    expect(steps[0].visualizationState.stack.frames).toHaveLength(1)

    // Step 2: Transition into recursive frame (depth 2)
    expect(steps[1].highlightedLine).toBe(5)
    expect(steps[1].executionPhase).toBe('METHOD_ENTRY')
    expect(steps[1].visualizationState.stack.frames).toHaveLength(2)
  })
})
