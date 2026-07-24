import { describe, it, expect } from 'vitest'
import { transformToEducationalTimeline, type RawTraceEvent } from './transformToEducationalTimeline'

describe('transformToEducationalTimeline — Educational Timeline Architecture', () => {
  it('transforms sequential line execution deterministically', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: 'main',
        lineNumber: 9,
        callStack: [{ className: 'Student', methodName: 'main', lineNumber: 9, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: 'main',
        lineNumber: 10,
        callStack: [
          {
            className: 'Student',
            methodName: 'main',
            lineNumber: 10,
            locals: [{ name: 'a', type: 'int', value: 5 }],
          },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(2)

    // Step 0: Highlighted line 9 (about to execute int a = 5;) — a does not exist yet
    expect(steps[0].highlightedLine).toBe(9)
    expect(steps[0].executionPhase).toBe('PROGRAM_START')
    expect(steps[0].visualizationState.variables.variables).toHaveLength(0)

    // Step 1: Highlighted line 10 (int b = 10;) — a has executed and appears
    expect(steps[1].highlightedLine).toBe(10)
    expect(steps[1].executionPhase).toBe('NORMAL_LINE')
    expect(steps[1].visualizationState.variables.variables).toHaveLength(1)
    expect(steps[1].visualizationState.variables.variables[0].name).toBe('a')
  })

  it('classifies constructor entry and object allocation explicitly', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: 'main',
        lineNumber: 15,
        callStack: [{ className: 'Student', methodName: 'main', lineNumber: 15 }],
      },
      {
        sequence: 2,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: '<init>',
        lineNumber: 4,
        callStack: [
          { className: 'Student', methodName: '<init>', lineNumber: 4 },
          { className: 'Student', methodName: 'main', lineNumber: 15 },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(2)

    // Step 0: Focuses on statement in main() before entering constructor
    expect(steps[0].highlightedLine).toBe(15)
    expect(steps[0].highlightedMethod).toBe('main')
    expect(steps[0].visualizationState.stack.frames).toHaveLength(1) // main() frame only

    // Step 1: Transitions into constructor
    expect(steps[1].executionPhase).toBe('CONSTRUCTOR_ENTRY')
    expect(steps[1].highlightedMethod).toBe('Student')
    expect(steps[1].visualizationState.stack.frames).toHaveLength(2) // Student() frame pushed
    expect(steps[1].executionEvents).toContainEqual({
      type: 'FRAME_PUSHED',
      description: 'Entered constructor Student()',
    })
    expect(steps[1].executionEvents).toContainEqual({
      type: 'OBJECT_ALLOCATED',
      description: 'Allocated heap space for Student',
    })
  })

  it('handles method returns and preserves return value badges on returning frames', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Calculator.java',
        className: 'Calculator',
        methodName: 'add',
        lineNumber: 15,
        returnValue: { kind: 'int', value: 7, valueString: '7' },
        callStack: [
          { className: 'Calculator', methodName: 'add', lineNumber: 15 },
          { className: 'Calculator', methodName: 'main', lineNumber: 5 },
        ],
      },
      {
        sequence: 2,
        sourceFile: 'Calculator.java',
        className: 'Calculator',
        methodName: 'main',
        lineNumber: 6,
        callStack: [{ className: 'Calculator', methodName: 'main', lineNumber: 6 }],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(2)

    expect(steps[0].executionPhase).toBe('METHOD_EXIT')
    expect(steps[0].visualizationState.stack.frames[0].returnValue?.valueString).toBe('7')
    expect(steps[0].executionEvents).toContainEqual({
      type: 'METHOD_RETURNED',
      description: 'Method add() returned',
      details: { returnValue: { kind: 'int', value: 7, valueString: '7' } },
    })
  })

  it('accumulates console output state step-by-step without synthetic messages', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 5,
        outputEvents: [{ type: 'stdout', text: 'Hello ' }],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 6,
        outputEvents: [{ type: 'stdout', text: 'World\n' }],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(2)

    expect(steps[0].consoleState).toHaveLength(1)
    expect(steps[0].consoleState[0].text).toBe('Hello ')

    expect(steps[1].consoleState).toHaveLength(2)
    expect(steps[1].consoleState[0].text).toBe('Hello ')
    expect(steps[1].consoleState[1].text).toBe('World\n')
  })

  it('handles uncaught exceptions with JVM stderr output and EXCEPTION phase', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 25,
        type: 'exception',
        exceptionType: 'java.lang.ArrayIndexOutOfBoundsException',
        exceptionMessage: 'Index 5 out of bounds for length 2',
        outputEvents: [
          {
            type: 'stderr',
            text: 'Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 2\n\tat Main.main(Main.java:25)\n',
          },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(1)
    expect(steps[0].executionPhase).toBe('EXCEPTION')
    expect(steps[0].consoleState).toHaveLength(1)
    expect(steps[0].consoleState[0].type).toBe('stderr')
    expect(steps[0].consoleState[0].text).toContain('ArrayIndexOutOfBoundsException')
  })
})
