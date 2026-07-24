import { describe, it, expect } from 'vitest'
import { generateExplanation } from './generateExplanation'
import { transformToEducationalTimeline, type RawTraceEvent } from '@/features/timeline/transformToEducationalTimeline'


describe('Method Lifecycle Semantic Explanations (Tests A-L)', () => {
  // --------------------------------------------------
  // TEST A — Program Entry
  // --------------------------------------------------
  it('TEST A — Program Entry starting in main()', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 5,
        callStack: [{ className: 'Main', methodName: 'main', lineNumber: 5, locals: [] }],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps).toHaveLength(1)
    expect(steps[0].executionPhase).toBe('PROGRAM_START')

    const explanation = generateExplanation(null, steps[0].visualizationState, steps[0])
    expect(explanation).toBe('Program execution started in main().')
  })

  // --------------------------------------------------
  // TEST B — Static Method
  // --------------------------------------------------
  it('TEST B — Static Method call', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 5,
        callStack: [{ className: 'Main', methodName: 'main', lineNumber: 5, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'add',
        lineNumber: 12,
        callStack: [
          { className: 'Main', methodName: 'add', lineNumber: 12, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps[1].executionPhase).toBe('METHOD_ENTRY')

    const explanation = generateExplanation(steps[0].visualizationState, steps[1].visualizationState, steps[1])
    expect(explanation).toBe('main() called add(). A new stack frame was created.')
  })

  // --------------------------------------------------
  // TEST C — Instance Method
  // --------------------------------------------------
  it('TEST C — Instance Method call', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 5,
        callStack: [{ className: 'Main', methodName: 'main', lineNumber: 5, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Student',
        methodName: 'calculate',
        lineNumber: 20,
        callStack: [
          { className: 'Student', methodName: 'calculate', lineNumber: 20, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps[1].executionPhase).toBe('METHOD_ENTRY')

    const explanation = generateExplanation(steps[0].visualizationState, steps[1].visualizationState, steps[1])
    expect(explanation).toBe('main() called calculate(). A new stack frame was created.')
  })

  // --------------------------------------------------
  // TEST D — Constructor
  // --------------------------------------------------
  it('TEST D — Constructor invocation (no <init> syntax)', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 5,
        callStack: [{ className: 'Main', methodName: 'main', lineNumber: 5, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: '<init>',
        lineNumber: 10,
        callStack: [
          { className: 'Student', methodName: '<init>', lineNumber: 10, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps[1].executionPhase).toBe('CONSTRUCTOR_ENTRY')

    const explanation = generateExplanation(steps[0].visualizationState, steps[1].visualizationState, steps[1])
    expect(explanation).toBe('main() invoked the Student constructor. A new Student() stack frame was created.')
  })

  // --------------------------------------------------
  // TEST E — Nested Calls
  // --------------------------------------------------
  it('TEST E — Nested Calls: main -> a -> b', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 5,
        callStack: [{ className: 'Main', methodName: 'main', lineNumber: 5, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'a',
        lineNumber: 10,
        callStack: [
          { className: 'Main', methodName: 'a', lineNumber: 10, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
      {
        sequence: 3,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'b',
        lineNumber: 15,
        callStack: [
          { className: 'Main', methodName: 'b', lineNumber: 15, locals: [] },
          { className: 'Main', methodName: 'a', lineNumber: 10, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps[1].executionPhase).toBe('METHOD_ENTRY')
    expect(steps[2].executionPhase).toBe('METHOD_ENTRY')

    const exp1 = generateExplanation(steps[0].visualizationState, steps[1].visualizationState, steps[1])
    expect(exp1).toBe('main() called a(). A new stack frame was created.')

    const exp2 = generateExplanation(steps[1].visualizationState, steps[2].visualizationState, steps[2])
    expect(exp2).toBe('a() called b(). A new stack frame was created.')
  })

  // --------------------------------------------------
  // TEST F — Recursion
  // --------------------------------------------------
  it('TEST F — Recursion (distinct same-name frames)', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'factorial',
        lineNumber: 10,
        callStack: [{ className: 'Main', methodName: 'factorial', lineNumber: 10, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'factorial',
        lineNumber: 10,
        callStack: [
          { className: 'Main', methodName: 'factorial', lineNumber: 10, locals: [] },
          { className: 'Main', methodName: 'factorial', lineNumber: 10, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps[1].executionPhase).toBe('METHOD_ENTRY')
    expect(steps[1].transition?.isRecursion).toBe(true)

    const explanation = generateExplanation(steps[0].visualizationState, steps[1].visualizationState, steps[1])
    expect(explanation).toBe('factorial() called factorial() recursively. A new stack frame was created.')
  })

  // --------------------------------------------------
  // TEST G — Primitive Return
  // --------------------------------------------------
  it('TEST G — Primitive Return with value', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'add',
        lineNumber: 12,
        callStack: [
          { className: 'Main', methodName: 'add', lineNumber: 12, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'add',
        lineNumber: 12,
        returnValue: { kind: 'int', value: 7, valueString: '7' },
        callStack: [
          { className: 'Main', methodName: 'add', lineNumber: 12, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps[1].executionPhase).toBe('METHOD_EXIT')

    const explanation = generateExplanation(steps[0].visualizationState, steps[1].visualizationState, steps[1])
    expect(explanation).toBe('add() returned 7 to main(). Its stack frame was removed.')
  })

  // --------------------------------------------------
  // TEST H — Reference Return
  // --------------------------------------------------
  it('TEST H — Reference Return', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'createStudent',
        lineNumber: 8,
        callStack: [
          { className: 'Main', methodName: 'createStudent', lineNumber: 8, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'createStudent',
        lineNumber: 8,
        returnValue: { kind: 'object_ref', valueString: 'obj_2', objectId: 'obj_2' },
        callStack: [
          { className: 'Main', methodName: 'createStudent', lineNumber: 8, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps[1].executionPhase).toBe('METHOD_EXIT')

    const explanation = generateExplanation(steps[0].visualizationState, steps[1].visualizationState, steps[1])
    expect(explanation).toBe('createStudent() returned reference obj_2 to main(). Its stack frame was removed.')
  })

  // --------------------------------------------------
  // TEST I — Void Return
  // --------------------------------------------------
  it('TEST I — Void Return Control Resume', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'printMessage',
        lineNumber: 14,
        callStack: [
          { className: 'Main', methodName: 'printMessage', lineNumber: 14, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 6,
        callStack: [{ className: 'Main', methodName: 'main', lineNumber: 6, locals: [] }],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps[1].executionPhase).toBe('METHOD_EXIT')

    const explanation = generateExplanation(steps[0].visualizationState, steps[1].visualizationState, steps[1])
    expect(explanation).toBe('printMessage() completed and returned control to main().')
  })

  // --------------------------------------------------
  // TEST J — Constructor Completion
  // --------------------------------------------------
  it('TEST J — Constructor finished initialization', () => {
    const rawEvents: RawTraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: '<init>',
        lineNumber: 10,
        callStack: [
          { className: 'Student', methodName: '<init>', lineNumber: 10, locals: [] },
          { className: 'Main', methodName: 'main', lineNumber: 5, locals: [] },
        ],
      },
      {
        sequence: 2,
        sourceFile: 'Main.java',
        className: 'Main',
        methodName: 'main',
        lineNumber: 6,
        callStack: [{ className: 'Main', methodName: 'main', lineNumber: 6, locals: [] }],
      },
    ]

    const steps = transformToEducationalTimeline(rawEvents)
    expect(steps[1].executionPhase).toBe('CONSTRUCTOR_EXIT')

    const explanation = generateExplanation(steps[0].visualizationState, steps[1].visualizationState, steps[1])
    expect(explanation).toBe('Student() finished initialization and returned control to main().')
  })
})
