import { describe, it, expect, beforeEach } from 'vitest'
import { usePlaybackStore, type TraceEvent } from '@/store/usePlaybackStore'
import { generateExplanation } from '@/features/visualization/generateExplanation'

describe('Milestone Stability & Correctness Verification', () => {
  beforeEach(() => {
    usePlaybackStore.setState({
      sessionId: null,
      executionId: null,
      status: null,
      timeline: [],
      currentFrameIndex: 0,
      totalFrameCount: 0,
      currentModel: null,
      previousModel: null,
      metadata: null,
      consoleStream: [],
      isPlaying: false,
      playSpeed: 1.0,
      connectionStatus: 'DISCONNECTED',
      error: null,
      cache: {},
    })
  })

  it('preserves exact chronological order and step-awareness for console stdout/stderr', () => {
    const traceEvents: TraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Test.java',
        className: 'Test',
        methodName: 'main',
        lineNumber: 5,
        outputEvents: [{ type: 'stdout', text: 'Hello World' }],
      },
      {
        sequence: 2,
        sourceFile: 'Test.java',
        className: 'Test',
        methodName: 'main',
        lineNumber: 6,
        outputEvents: [{ type: 'stderr', text: 'Warning message' }],
      },
      {
        sequence: 3,
        sourceFile: 'Test.java',
        className: 'Test',
        methodName: 'main',
        lineNumber: 7,
        outputEvents: [{ type: 'stdout', text: 'Line 3 output' }],
      },
    ]

    usePlaybackStore.getState().loadTraceTimeline('exec-1', 'COMPLETED', traceEvents)
    let stream = usePlaybackStore.getState().consoleStream
    expect(stream).toHaveLength(1)
    expect(stream[0].text).toBe('Hello World')

    // Seek forward to step 2
    usePlaybackStore.getState().jumpToFrame(1)
    stream = usePlaybackStore.getState().consoleStream
    expect(stream).toHaveLength(2)
    expect(stream[0].type).toBe('stdout')
    expect(stream[0].text).toBe('Hello World')
    expect(stream[1].type).toBe('stderr')
    expect(stream[1].text).toBe('Warning message')

    // Seek forward to step 3
    usePlaybackStore.getState().jumpToFrame(2)
    stream = usePlaybackStore.getState().consoleStream
    expect(stream).toHaveLength(3)
    expect(stream[2].text).toBe('Line 3 output')

    // Seek backward to step 1 (step-aware reconstruction)
    usePlaybackStore.getState().jumpToFrame(0)
    stream = usePlaybackStore.getState().consoleStream
    expect(stream).toHaveLength(1)
    expect(stream[0].text).toBe('Hello World')

    // Restart resets to step 0
    usePlaybackStore.getState().stop()
    stream = usePlaybackStore.getState().consoleStream
    expect(stream).toHaveLength(1)
    expect(stream[0].text).toBe('Hello World')
  })

  it('immediately updates variables and state for the highlighted line during playback', () => {
    const traceEvents: TraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: 'main',
        lineNumber: 9, // int a = 5;
        callStack: [{ className: 'Student', methodName: 'main', lineNumber: 9, locals: [] }],
      },
      {
        sequence: 2,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: 'main',
        lineNumber: 10, // int b = 10;
        callStack: [
          {
            className: 'Student',
            methodName: 'main',
            lineNumber: 10,
            locals: [{ name: 'a', type: 'int', value: { kind: 'int', value: 5, valueString: '5' } }],
          },
        ],
      },
      {
        sequence: 3,
        sourceFile: 'Student.java',
        className: 'Student',
        methodName: 'main',
        lineNumber: 11, // int c = a + b;
        callStack: [
          {
            className: 'Student',
            methodName: 'main',
            lineNumber: 11,
            locals: [
              { name: 'a', type: 'int', value: { kind: 'int', value: 5, valueString: '5' } },
              { name: 'b', type: 'int', value: { kind: 'int', value: 10, valueString: '10' } },
            ],
          },
        ],
      },
    ]

    usePlaybackStore.getState().loadTraceTimeline('exec-timing', 'COMPLETED', traceEvents)

    // At step 0 (Line 9: int a = 5;) — line is about to execute, so 'a' does not exist yet
    let model = usePlaybackStore.getState().currentModel
    expect(model?.highlights.currentLine).toBe(9)
    expect(model?.variables.variables).toHaveLength(0)

    // Jump to step 1 (Line 10: int b = 10;) — 'a' has executed and appears
    usePlaybackStore.getState().jumpToFrame(1)
    model = usePlaybackStore.getState().currentModel
    expect(model?.highlights.currentLine).toBe(10)
    expect(model?.variables.variables).toHaveLength(1)
    expect(model?.variables.variables[0].name).toBe('a')

    // Jump to step 2 (Line 11: int c = a + b;) — 'b' has executed and appears
    usePlaybackStore.getState().jumpToFrame(2)
    model = usePlaybackStore.getState().currentModel
    expect(model?.highlights.currentLine).toBe(11)
    expect(model?.variables.variables).toHaveLength(2)
    expect(model?.variables.variables[1].name).toBe('b')
  })

  it('formats <init> constructors consistently as ClassName()', () => {
    const traceEvents: TraceEvent[] = [
      {
        sequence: 1,
        sourceFile: 'Student.java',
        className: 'com.example.Student',
        methodName: '<init>',
        lineNumber: 10,
        callStack: [
          {
            className: 'com.example.Student',
            methodName: '<init>',
            lineNumber: 10,
            locals: [],
          },
        ],
      },
    ]

    usePlaybackStore.getState().loadTraceTimeline('exec-2', 'COMPLETED', traceEvents)
    const model = usePlaybackStore.getState().currentModel
    expect(model).toBeDefined()
    expect(model?.stack.frames[0].methodName).toBe('Student')

    const explanation = generateExplanation(null, model)
    expect(explanation).toContain('Student')
    expect(explanation).not.toContain('<init>')
  })

  it('transforms raw JVM exception metadata into student-friendly explanations', () => {
    const npeEvent: TraceEvent = {
      sequence: 1,
      sourceFile: 'Main.java',
      className: 'Main',
      methodName: 'main',
      lineNumber: 12,
      type: 'exception',
      exceptionType: 'java.lang.NullPointerException',
      exceptionMessage: 'Cannot read field "name" because "p" is null',
    }

    usePlaybackStore.getState().loadTraceTimeline('exec-3', 'EXCEPTION', [npeEvent])
    const model = usePlaybackStore.getState().currentModel
    expect(model?.status).toBe('EXCEPTION')
    expect(model?.exceptionInfo?.exceptionType).toBe('java.lang.NullPointerException')

    const explanation = generateExplanation(null, model)
    expect(explanation).toContain('NullPointerException at line 12')
    expect(explanation).toContain('null reference')
  })

  it('visualizes method return values in model and explanations', () => {
    const prevEvent: TraceEvent = {
      sequence: 1,
      sourceFile: 'Calculator.java',
      className: 'Calculator',
      methodName: 'add',
      lineNumber: 15,
      callStack: [
        { className: 'Calculator', methodName: 'add', lineNumber: 15 },
        { className: 'Calculator', methodName: 'main', lineNumber: 5 },
      ],
    }

    const currEvent: TraceEvent = {
      sequence: 2,
      sourceFile: 'Calculator.java',
      className: 'Calculator',
      methodName: 'main',
      lineNumber: 6,
      returnValue: { kind: 'int', value: 15, valueString: '15' },
      callStack: [{ className: 'Calculator', methodName: 'main', lineNumber: 6 }],
    }

    const prevModel = {
      stack: {
        frames: [
          { className: 'Calculator', methodName: 'add', lineNumber: 15, locals: [], isActive: true },
          { className: 'Calculator', methodName: 'main', lineNumber: 5, locals: [], isActive: false },
        ],
      },
      heap: { objects: {} },
      variables: { variables: [] },
      graph: { nodes: [], edges: [] },
      highlights: { currentLine: 15, currentMethod: 'add', currentStackFrame: 'Calculator.add', activeHighlights: [] },
      status: 'RUNNING' as const,
    }

    usePlaybackStore.getState().loadTraceTimeline('exec-4', 'COMPLETED', [prevEvent, currEvent])
    usePlaybackStore.getState().jumpToFrame(1)

    const currModel = usePlaybackStore.getState().currentModel
    expect(currModel?.returnValue?.valueString).toBe('15')

    const explanation = generateExplanation(prevModel, currModel)
    expect(explanation).toContain('add() finished')
    expect(explanation).toContain('returned value 15')
  })
})
