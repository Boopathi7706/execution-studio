import type {
  EducationalStep,
  ExecutionPhase,
  PedagogicalEvent,
  OutputLogEvent,
} from '@/types/educationalTimeline.types'
import type { VisualizationModel, DisplayValue, VariableView, FrameView, HeapObjectView, ExecutionStatus } from '@/types/visualization.types'
import { getSimpleClassName } from '@/store/usePlaybackStore'

export interface RawTraceEvent {
  sequence?: number
  seq?: number
  sourceFile?: string
  className?: string
  methodName?: string
  lineNumber?: number
  type?: string
  exceptionType?: string
  exceptionMessage?: string
  returnValue?: Record<string, unknown>
  outputEvents?: { type: 'stdout' | 'stderr'; text: string; timestamp?: number }[]
  callStack?: {
    className?: string
    methodName?: string
    lineNumber?: number
    locals?: Record<string, unknown>[]
    localVariables?: Record<string, unknown>[]
    returnValue?: Record<string, unknown>
  }[]
  heap?: Record<string, unknown>
  heapObjects?: Record<string, unknown>
}

/**
 * Pure, deterministic transformer converting raw JDI trace events into EducationalSteps.
 * Each EducationalStep explicitly pairs the highlighted source line with the exact post-execution memory state.
 */
export function transformToEducationalTimeline(rawEvents: RawTraceEvent[]): EducationalStep[] {
  if (!rawEvents || rawEvents.length === 0) {
    return []
  }

  const steps: EducationalStep[] = []
  const accumulatedConsole: OutputLogEvent[] = []
  const total = rawEvents.length

  for (let i = 0; i < total; i++) {
    const current = rawEvents[i]
    const prev = i > 0 ? rawEvents[i - 1] : null

    // 1. Accumulate console output
    if (current.outputEvents && current.outputEvents.length > 0) {
      for (const entry of current.outputEvents) {
        accumulatedConsole.push({
          type: entry.type === 'stderr' ? 'stderr' : 'stdout',
          text: entry.text,
          timestamp: entry.timestamp,
        })
      }
    }

    // 2. Determine pre-execution visualization model (highlighted line is about to execute)
    const stateEvent = current
    const baseModel = buildVisualizationModelFromRawEvent(stateEvent, current)

    // Override highlighted line to represent current line
    const highlightedLine = current.lineNumber || baseModel.highlights.currentLine || 1
    const rawClass = current.className || baseModel.highlights.currentStackFrame.split('.')[0] || 'Main'
    const rawMethod = current.methodName || 'main'
    const highlightedMethod = rawMethod === '<init>' ? getSimpleClassName(rawClass) : rawMethod
    const highlightedClass = rawClass
    const sourceFile = current.sourceFile || 'Main.java'

    const visualizationState: VisualizationModel = {
      ...baseModel,
      highlights: {
        ...baseModel.highlights,
        currentLine: highlightedLine,
        currentMethod: highlightedMethod,
        currentStackFrame: `${highlightedClass}.${highlightedMethod}`,
      },
    }

    // 3. Determine Execution Phase using stack transition detection
    const transition = detectStackTransition(prev, current, i)
    const executionPhase = transition.phase

    // 4. Generate Pedagogical Events based on transition
    const executionEvents: PedagogicalEvent[] = []
    if (executionPhase === 'PROGRAM_START') {
      const entryMethod = current.methodName || 'main'
      executionEvents.push({
        type: 'METHOD_CALLED',
        description: `Program execution started in ${entryMethod}().`,
      })
    } else if (executionPhase === 'CONSTRUCTOR_ENTRY') {
      const className = transition.calleeClass ? getSimpleClassName(transition.calleeClass) : 'Object'
      executionEvents.push({ type: 'FRAME_PUSHED', description: `Entered constructor ${className}()` })
      executionEvents.push({ type: 'OBJECT_ALLOCATED', description: `Allocated heap space for ${className}` })
    } else if (executionPhase === 'METHOD_ENTRY') {
      const callee = transition.calleeMethod || 'method'
      executionEvents.push({
        type: 'FRAME_PUSHED',
        description: transition.isRecursion
          ? `Called method ${callee}() recursively`
          : `Called method ${callee}()`,
      })
    } else if (executionPhase === 'METHOD_EXIT' || executionPhase === 'CONSTRUCTOR_EXIT') {
      const callee = transition.calleeMethod || 'method'
      const details = current.returnValue ? { returnValue: current.returnValue } : undefined
      executionEvents.push({
        type: 'METHOD_RETURNED',
        description: executionPhase === 'CONSTRUCTOR_EXIT'
          ? `${callee}() finished initialization`
          : `Method ${callee}() returned`,
        details,
      })
    } else if (executionPhase === 'EXCEPTION') {
      executionEvents.push({
        type: 'EXCEPTION_THROWN',
        description: `Uncaught ${current.exceptionType || 'Exception'} thrown at line ${highlightedLine}`,
      })
    }

    if (current.outputEvents && current.outputEvents.length > 0) {
      executionEvents.push({ type: 'CONSOLE_OUTPUT', description: 'Emitted program output' })
    }

    // 5. Action Summary
    const actionSummary = buildActionSummary(executionPhase, highlightedMethod, highlightedLine, current)

    steps.push({
      stepIndex: i,
      totalSteps: total,
      highlightedLine,
      highlightedMethod,
      highlightedClass,
      sourceFile,
      executionPhase,
      executionEvents,
      visualizationState,
      consoleState: [...accumulatedConsole],
      actionSummary,
      transition: {
        callerMethod: transition.callerMethod,
        callerClass: transition.callerClass,
        calleeMethod: transition.calleeMethod,
        calleeClass: transition.calleeClass,
        isRecursion: transition.isRecursion,
        returnValue: transition.returnValue,
      },
    })
  }

  return steps
}

function buildVisualizationModelFromRawEvent(stateEvent: RawTraceEvent, currentEvent: RawTraceEvent): VisualizationModel {
  const rawStack = stateEvent.callStack || []
  const frames: FrameView[] = rawStack.map((f: any, idx: number) => {
    const rawLocals = f.locals || f.localVariables || []
    const locals: VariableView[] = rawLocals.map((v: any) => ({
      name: v.name,
      declaredType: v.type || v.declaredType || 'Object',
      value: parseDisplayValue(v.value),
      scope: 'local',
      changed: false,
    }))

    const rawClass = f.className || stateEvent.className || 'Test'
    const rawMethod = f.methodName || stateEvent.methodName || 'main'
    const methodName = rawMethod === '<init>' ? getSimpleClassName(rawClass) : rawMethod

    return {
      className: rawClass,
      methodName,
      lineNumber: f.lineNumber || stateEvent.lineNumber || 1,
      locals,
      isActive: idx === 0,
      returnValue: (idx === 0 && currentEvent.returnValue)
        ? parseDisplayValue(currentEvent.returnValue)
        : (f.returnValue ? parseDisplayValue(f.returnValue) : undefined),
    }
  })

  if (frames.length === 0 && (stateEvent.className || stateEvent.methodName || stateEvent.lineNumber)) {
    const rawClass = stateEvent.className || 'Test'
    const rawMethod = stateEvent.methodName || 'main'
    const methodName = rawMethod === '<init>' ? getSimpleClassName(rawClass) : rawMethod
    frames.push({
      className: rawClass,
      methodName,
      lineNumber: stateEvent.lineNumber || 1,
      locals: [],
      isActive: true,
    })
  }

  const activeFrame = frames[0]
  const currentLocals = activeFrame ? activeFrame.locals : []
  const rawHeap = stateEvent.heap || stateEvent.heapObjects || {}
  const heapObjects = parseHeapObjects(rawHeap)

  const returnValue = currentEvent.returnValue ? parseDisplayValue(currentEvent.returnValue) : undefined
  const isException = currentEvent.type === 'exception' || !!currentEvent.exceptionType
  const status: ExecutionStatus = isException ? 'EXCEPTION' : 'RUNNING'

  const exceptionInfo = isException
    ? {
        exceptionType: currentEvent.exceptionType || 'java.lang.RuntimeException',
        exceptionMessage: currentEvent.exceptionMessage || 'Uncaught exception occurred',
        lineNumber: currentEvent.lineNumber || (activeFrame ? activeFrame.lineNumber : 1),
        className: currentEvent.className || (activeFrame ? activeFrame.className : 'Main'),
        methodName: activeFrame ? activeFrame.methodName : 'main',
      }
    : undefined

  return {
    stack: { frames },
    heap: { objects: heapObjects },
    variables: { variables: currentLocals },
    graph: { nodes: [], edges: [] },
    highlights: {
      currentLine: stateEvent.lineNumber || (activeFrame ? activeFrame.lineNumber : 1),
      currentMethod: activeFrame ? activeFrame.methodName : 'main',
      currentStackFrame: activeFrame ? `${activeFrame.className}.${activeFrame.methodName}` : 'main',
      activeHighlights: [],
    },
    status,
    returnValue,
    outputEvents: currentEvent.outputEvents || [],
    exceptionInfo,
  }
}

function parseHeapObjects(rawHeap: any): Record<string, HeapObjectView> {
  if (!rawHeap || typeof rawHeap !== 'object') return {}
  const result: Record<string, HeapObjectView> = {}

  Object.entries(rawHeap).forEach(([id, obj]: [string, any]) => {
    if (!obj) return
    const objId = String(obj.objectId || obj.id || id)
    const type: 'object' | 'array' =
      obj.type === 'array' || (obj.classNameOrType && obj.classNameOrType.includes('[]')) || Array.isArray(obj.elements)
        ? 'array'
        : 'object'

    const fieldsOrElements: Record<string, DisplayValue> = {}
    const rawFields = obj.fieldsOrElements || obj.fields || obj.elements || {}

    if (typeof rawFields === 'object' && rawFields !== null) {
      Object.entries(rawFields).forEach(([k, v]) => {
        fieldsOrElements[k] = parseDisplayValue(v)
      })
    }

    result[objId] = {
      objectId: objId,
      type,
      classNameOrType: obj.classNameOrType || obj.type || 'java.lang.Object',
      fieldsOrElements,
    }
  })

  return result
}

function parseDisplayValue(rawVal: any, declaredType?: string): DisplayValue {
  if (rawVal === null || rawVal === undefined) {
    return { kind: 'null', valueString: 'null', value: 'null' }
  }

  if (typeof rawVal === 'string') {
    if (rawVal === 'null') {
      return { kind: 'null', valueString: 'null', value: 'null' }
    }
    return { kind: 'string', valueString: rawVal, value: rawVal }
  }

  if (typeof rawVal === 'object') {
    const rawKind = rawVal.kind || rawVal.type
    const kind =
      rawKind ||
      (rawVal.type === 'array' || (declaredType && declaredType.includes('[]'))
        ? 'array_ref'
        : 'object_ref')

    if (kind === 'null' || rawVal.value === 'null' || rawVal.valueString === 'null') {
      return { kind: 'null', valueString: 'null', value: 'null' }
    }

    const rawId = rawVal.objectId || rawVal.id || rawVal.referenceId
    const fallbackId = (typeof rawVal.value === 'string' && rawVal.value.startsWith('obj_')) ? rawVal.value : undefined
    const objectId = rawId || fallbackId

    const val = rawVal.value !== undefined ? rawVal.value : rawVal.valueString
    const valString = rawVal.valueString || (typeof val === 'string' ? val : val !== undefined ? String(val) : String(objectId || ''))

    const finalKind = (kind === 'reference' && !objectId)
      ? (typeof val === 'number' ? 'int' : 'primitive')
      : (kind === 'reference' ? (declaredType && declaredType.includes('[]') ? 'array_ref' : 'object_ref') : kind)

    return {
      kind: finalKind,
      objectId: objectId ? String(objectId) : undefined,
      valueString: valString,
      value: val,
    }
  }

  if (typeof rawVal === 'boolean') {
    return { kind: 'boolean', valueString: String(rawVal), value: rawVal }
  }

  if (typeof rawVal === 'number') {
    return { kind: 'int', valueString: String(rawVal), value: rawVal }
  }

  return { kind: 'primitive', valueString: String(rawVal), value: rawVal }
}

function buildActionSummary(phase: ExecutionPhase, method: string, line: number, event: RawTraceEvent): string {
  switch (phase) {
    case 'PROGRAM_START':
      return `Program execution started at line ${line}.`
    case 'CONSTRUCTOR_ENTRY':
      return `Entered constructor ${method}() at line ${line}.`
    case 'CONSTRUCTOR_EXIT':
      return `Finished constructor ${method}() at line ${line}.`
    case 'METHOD_ENTRY':
      return `Entered method ${method}() at line ${line}.`
    case 'METHOD_EXIT':
      return event.returnValue ? `Method ${method}() returned ${parseDisplayValue(event.returnValue).valueString} at line ${line}.` : `Method ${method}() returned at line ${line}.`
    case 'EXCEPTION':
      return `Uncaught ${event.exceptionType || 'Exception'} thrown at line ${line}.`
    default:
      return `Executed line ${line} in ${method}().`
  }
}

interface StackTransition {
  phase: ExecutionPhase
  callerMethod?: string
  callerClass?: string
  calleeMethod?: string
  calleeClass?: string
  poppedFrame?: any
  pushedFrame?: any
  isRecursion: boolean
  returnValue?: any
}

function detectStackTransition(
  prev: RawTraceEvent | null,
  curr: RawTraceEvent,
  index: number
): StackTransition {
  const isException = curr.type === 'exception' || !!curr.exceptionType
  if (isException) {
    return { phase: 'EXCEPTION', isRecursion: false }
  }

  // 3. Return value present on current statement (Method/Constructor Exit)
  if (curr.returnValue) {
    const currStack = curr.callStack || []
    const topFrame = currStack[0]
    const topMethod = topFrame?.methodName || curr.methodName || ''
    const phase: ExecutionPhase = topMethod === '<init>' ? 'CONSTRUCTOR_EXIT' : 'METHOD_EXIT'
    const callerFrame = currStack[1]
    return {
      phase,
      poppedFrame: topFrame,
      callerMethod: callerFrame?.methodName,
      callerClass: callerFrame?.className,
      calleeMethod: topMethod,
      calleeClass: topFrame?.className || curr.className,
      isRecursion: false,
      returnValue: curr.returnValue
    }
  }

  if (index === 0 || !prev) {
    return { phase: 'PROGRAM_START', isRecursion: false }
  }

  const prevStack = prev.callStack || []
  const currStack = curr.callStack || []
  const prevDepth = prevStack.length
  const currDepth = currStack.length

  // 1. Frame Pop (Method/Constructor Exit)
  if (currDepth < prevDepth && prevDepth > 0) {
    const poppedFrame = prevStack[0]
    const poppedMethod = poppedFrame?.methodName || ''
    const phase: ExecutionPhase = poppedMethod === '<init>' ? 'CONSTRUCTOR_EXIT' : 'METHOD_EXIT'
    
    // Check if the caller we are returning to is same name
    const callerFrame = currStack[0]
    return {
      phase,
      poppedFrame,
      callerMethod: callerFrame?.methodName,
      callerClass: callerFrame?.className,
      calleeMethod: poppedMethod,
      calleeClass: poppedFrame?.className,
      isRecursion: false,
      returnValue: curr.returnValue
    }
  }

  // 2. Frame Push (Method/Constructor Entry)
  if (currDepth > prevDepth && currDepth > 0) {
    const pushedFrame = currStack[0]
    const callerFrame = currStack[1] || prevStack[0]
    const pushedMethod = pushedFrame?.methodName || ''
    const phase: ExecutionPhase = pushedMethod === '<init>' ? 'CONSTRUCTOR_ENTRY' : 'METHOD_ENTRY'

    // Recursion check: class & method name matches any frame below
    const isRecursion = currStack.slice(1).some(
      (frame: any) => frame.methodName === pushedMethod && frame.className === pushedFrame?.className
    )

    return {
      phase,
      pushedFrame,
      callerMethod: callerFrame?.methodName,
      callerClass: callerFrame?.className,
      calleeMethod: pushedMethod,
      calleeClass: pushedFrame?.className,
      isRecursion
    }
  }


  // 4. Same depth frame changes (native transition)
  if (currDepth === prevDepth && currDepth > 0) {
    const currTop = currStack[0]
    const prevTop = prevStack[0]
    if (currTop && prevTop && (currTop.methodName !== prevTop.methodName || currTop.className !== prevTop.className)) {
      const phase: ExecutionPhase = currTop.methodName === '<init>' ? 'CONSTRUCTOR_ENTRY' : 'METHOD_ENTRY'
      return {
        phase,
        pushedFrame: currTop,
        callerMethod: prevTop.methodName,
        callerClass: prevTop.className,
        calleeMethod: currTop.methodName,
        calleeClass: currTop.className,
        isRecursion: false
      }
    }
  }

  return { phase: 'NORMAL_LINE', isRecursion: false }
}
