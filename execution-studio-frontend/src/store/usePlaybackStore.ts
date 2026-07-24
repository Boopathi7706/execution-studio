import { create } from 'zustand'
import type {
  VisualizationModel,
  PlaybackResponse,
  DisplayValue,
  VariableView,
  FrameView,
  HeapObjectView,
  ExecutionStatus,
} from '@/types/visualization.types'
import type { EducationalStep } from '@/types/educationalTimeline.types'
import type { PlaybackMetadata } from '@/types/metadata.types'
import { PlaybackClient } from '@/api/PlaybackClient'
import { transformToEducationalTimeline } from '@/features/timeline/transformToEducationalTimeline'

export interface TraceEvent {
  sequence?: number
  seq?: number
  type?: string
  sourceFile?: string
  className?: string
  methodName?: string
  lineNumber?: number
  callStack?: {
    className?: string
    methodName?: string
    lineNumber?: number
    locals?: {
      name: string
      type?: string
      declaredType?: string
      value?: any
    }[]
    localVariables?: {
      name: string
      type?: string
      declaredType?: string
      value?: any
    }[]
    returnValue?: any
  }[]
  heap?: Record<string, any>
  heapObjects?: Record<string, any>
  exceptionType?: string
  exceptionMessage?: string
  outputEvents?: { type: 'stdout' | 'stderr'; text: string; timestamp?: number }[]
  returnValue?: any
}

export function getSimpleClassName(fullClassName?: string): string {
  if (!fullClassName) return 'Object'
  const parts = fullClassName.split('.')
  return parts[parts.length - 1]
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
    const kind =
      rawVal.kind ||
      (rawVal.type === 'array' || (declaredType && declaredType.includes('[]'))
        ? 'array_ref'
        : 'object_ref')

    if (kind === 'null' || rawVal.value === 'null' || rawVal.valueString === 'null') {
      return { kind: 'null', valueString: 'null', value: 'null' }
    }

    // Do NOT fallback to default 'obj_1' if objectId is unassigned!
    const objectId = rawVal.objectId || rawVal.id || rawVal.referenceId || undefined
    const val = rawVal.value !== undefined ? rawVal.value : rawVal.valueString

    return {
      kind,
      objectId,
      valueString: typeof val === 'string' ? val : val !== undefined ? String(val) : objectId,
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

function parseHeapObjects(rawHeap: any): Record<string, HeapObjectView> {
  if (!rawHeap || typeof rawHeap !== 'object') return {}

  const result: Record<string, HeapObjectView> = {}

  Object.entries(rawHeap).forEach(([id, obj]: [string, any]) => {
    if (!obj) return
    const objId = obj.objectId || id
    const type: 'object' | 'array' =
      obj.type === 'array' || (obj.classNameOrType && obj.classNameOrType.includes('[]'))
        ? 'array'
        : 'object'

    const fieldsOrElements: Record<string, DisplayValue> = {}
    const rawFields = obj.fieldsOrElements || obj.fields || obj.elements || {}

    if (typeof rawFields === 'object') {
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

function computeConsoleStream(timeline: TraceEvent[], uptoIndex: number): { type: 'stdout' | 'stderr'; text: string; step?: number }[] {
  const result: { type: 'stdout' | 'stderr'; text: string; step?: number }[] = []
  if (!timeline || timeline.length === 0) return result
  const maxIdx = Math.min(uptoIndex, timeline.length - 1)
  for (let i = 0; i <= maxIdx; i++) {
    const ev = timeline[i]
    if (ev && ev.outputEvents && Array.isArray(ev.outputEvents)) {
      ev.outputEvents.forEach((out: any) => {
        result.push({
          type: out.type === 'stderr' ? 'stderr' : 'stdout',
          text: out.text || String(out),
          step: i + 1,
        })
      })
    }
  }
  return result
}

function eventToVisualizationModel(event: TraceEvent | any): VisualizationModel | null {
  if (!event) return null

  // 1. Map callStack frames (reading either `f.locals` or `f.localVariables`)
  const rawStack = event.callStack || []
  const frames: FrameView[] = rawStack.map((f: any, idx: number) => {
    const rawLocals = f.locals || f.localVariables || []
    const locals: VariableView[] = rawLocals.map((v: any) => ({
      name: v.name,
      declaredType: v.type || v.declaredType || 'Object',
      value: parseDisplayValue(v.value, v.type || v.declaredType),
      scope: 'local',
      changed: false,
    }))

    const rawClass = f.className || event.className || 'Test'
    const rawMethod = f.methodName || event.methodName || 'main'
    const methodName = rawMethod === '<init>' ? getSimpleClassName(rawClass) : rawMethod

    return {
      className: rawClass,
      methodName,
      lineNumber: f.lineNumber || event.lineNumber || 1,
      locals,
      isActive: idx === 0,
      returnValue: (idx === 0 && event.returnValue) ? parseDisplayValue(event.returnValue) : (f.returnValue ? parseDisplayValue(f.returnValue) : undefined),
    }
  })

  // 2. Fallback single frame if callStack array is empty
  if (frames.length === 0 && (event.className || event.methodName || event.lineNumber)) {
    const rawClass = event.className || 'Test'
    const rawMethod = event.methodName || 'main'
    const methodName = rawMethod === '<init>' ? getSimpleClassName(rawClass) : rawMethod

    frames.push({
      className: rawClass,
      methodName,
      lineNumber: event.lineNumber || 1,
      locals: [],
      isActive: true,
    })
  }

  const activeFrame = frames[0]
  const currentLocals = activeFrame ? activeFrame.locals : []

  // 3. Map Heap objects (reading either `event.heap` or `event.heapObjects`)
  const rawHeap = event.heap || event.heapObjects || {}
  const heapObjects = parseHeapObjects(rawHeap)

  // 4. Return value, Output events & Exception info
  const returnValue = event.returnValue ? parseDisplayValue(event.returnValue) : undefined
  const outputEvents = event.outputEvents || []
  const isException = event.type === 'exception' || !!event.exceptionType
  const status: ExecutionStatus = isException ? 'EXCEPTION' : 'RUNNING'

  const exceptionInfo = isException
    ? {
        exceptionType: event.exceptionType || 'java.lang.RuntimeException',
        exceptionMessage: event.exceptionMessage || 'Uncaught exception occurred',
        lineNumber: event.lineNumber || (activeFrame ? activeFrame.lineNumber : 1),
        className: event.className || (activeFrame ? activeFrame.className : 'Main'),
        methodName: activeFrame ? activeFrame.methodName : 'main',
      }
    : undefined

  return {
    stack: { frames },
    heap: { objects: heapObjects },
    variables: { variables: currentLocals },
    graph: { nodes: [], edges: [] },
    highlights: {
      currentLine: event.lineNumber || (activeFrame ? activeFrame.lineNumber : 1),
      currentMethod: activeFrame ? activeFrame.methodName : 'main',
      currentStackFrame: activeFrame ? `${activeFrame.className}.${activeFrame.methodName}` : 'main',
      activeHighlights: [],
    },
    status,
    returnValue,
    outputEvents,
    exceptionInfo,
  }
}

const emptyModel: VisualizationModel = {
  stack: { frames: [] },
  heap: { objects: {} },
  variables: { variables: [] },
  graph: { nodes: [], edges: [] },
  highlights: { currentLine: 1, currentMethod: 'main', currentStackFrame: 'main', activeHighlights: [] },
  status: 'RUNNING',
}

export function buildStepVisualizationModel(
  timeline: TraceEvent[],
  index: number
): VisualizationModel {
  if (!timeline || timeline.length === 0) {
    return emptyModel
  }
  const safeIndex = Math.max(0, Math.min(index, timeline.length - 1))
  const currentEvent = timeline[safeIndex]
  const postEvent = safeIndex + 1 < timeline.length ? timeline[safeIndex + 1] : currentEvent

  const baseModel = eventToVisualizationModel(postEvent) || emptyModel
  const line = currentEvent.lineNumber || baseModel.highlights.currentLine

  return {
    ...baseModel,
    highlights: {
      ...baseModel.highlights,
      currentLine: line,
      currentMethod: currentEvent.methodName || baseModel.highlights.currentMethod,
    },
  }
}

interface PlaybackState {
  // State
  sessionId: string | null
  executionId: string | null
  status: string | null
  timeline: TraceEvent[]
  educationalTimeline: EducationalStep[]
  currentStep: EducationalStep | null
  currentFrameIndex: number
  totalFrameCount: number

  currentModel: VisualizationModel | null
  previousModel: VisualizationModel | null
  metadata: PlaybackMetadata | null
  consoleStream: { type: 'stdout' | 'stderr'; text: string; step?: number }[]
  isPlaying: boolean
  playSpeed: number
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'
  error: string | null
  cache: Record<number, VisualizationModel>
  selectedObjectId: string | null
  selectedFrameIndex: number | null
  expandedObjects: Record<string, boolean>
  isDeveloperMode: boolean
  hoveredVariableId: string | null
  hoveredObjectId: string | null

  // Internal references
  client: PlaybackClient
  playTimerId: ReturnType<typeof setTimeout> | null
  abortController: AbortController | null

  // Actions
  loadTraceTimeline: (executionId: string, status: string, timeline: TraceEvent[]) => void
  jumpToFrame: (index: number) => void
  stepNext: () => void
  stepPrev: () => void
  firstFrame: () => void
  lastFrame: () => void
  stop: () => void

  loadSession: (sessionId: string) => Promise<void>
  stepForward: () => Promise<void>
  stepBackward: () => Promise<void>
  seek: (index: number) => Promise<void>
  togglePlay: () => void
  setSpeed: (speed: number) => void
  restart: () => Promise<void>
  clearError: () => void
  resetStore: () => void
  destroy: () => void
  setSelectedObjectId: (id: string | null) => void
  setSelectedFrameIndex: (index: number | null) => void
  toggleObjectExpanded: (objectId: string) => void
  setObjectExpanded: (objectId: string, expanded: boolean) => void
  setIsDeveloperMode: (isDev: boolean) => void
  setHoveredVariableId: (id: string | null) => void
  setHoveredObjectId: (id: string | null) => void
}

export const usePlaybackStore = create<PlaybackState>((set, get) => {
  const runAutoStepLoop = () => {
    const { isPlaying, playSpeed, stepForward, togglePlay, metadata } = get()
    if (!isPlaying) return

    if (metadata && metadata.currentStepIndex >= metadata.totalSteps - 1) {
      togglePlay()
      return
    }

    const timerId = setTimeout(async () => {
      try {
        await stepForward()
        runAutoStepLoop()
      } catch {
        togglePlay()
      }
    }, 1000 / playSpeed)

    set({ playTimerId: timerId })
  }

  const clearActiveTimer = () => {
    const { playTimerId } = get()
    if (playTimerId) {
      clearTimeout(playTimerId)
      set({ playTimerId: null })
    }
  }

  const cancelPendingRequest = () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
      set({ abortController: null })
    }
  }

  const updateFrameIndex = (index: number) => {
    const { educationalTimeline, timeline, totalFrameCount, cache } = get()
    if (totalFrameCount === 0) return

    const validIndex = Math.max(0, Math.min(index, totalFrameCount - 1))
    const step = educationalTimeline[validIndex]
    const model = step ? step.visualizationState : buildStepVisualizationModel(timeline, validIndex)
    const consoleStream = step ? step.consoleState : computeConsoleStream(timeline, validIndex)

    let prevModel: VisualizationModel | null = null
    if (validIndex > 0) {
      if (cache[validIndex - 1]) {
        prevModel = cache[validIndex - 1]
      } else {
        const prevStep = educationalTimeline[validIndex - 1]
        prevModel = prevStep ? prevStep.visualizationState : buildStepVisualizationModel(timeline, validIndex - 1)
      }
    }

    set({
      currentFrameIndex: validIndex,
      previousModel: prevModel,
      currentModel: model,
      consoleStream,
      currentStep: step || null,
      selectedObjectId: null,
      selectedFrameIndex: null,
      metadata: {
        totalSteps: totalFrameCount,
        currentStepIndex: validIndex,
        progressPercentage: (validIndex / (totalFrameCount - 1 || 1)) * 100,
      },
    })
  }

  return {
    // Initial State
    sessionId: null,
    executionId: null,
    status: null,
    timeline: [],
    educationalTimeline: [],
    currentStep: null,
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
    client: new PlaybackClient(),
    playTimerId: null,
    abortController: null,
    selectedObjectId: null,
    selectedFrameIndex: null,
    expandedObjects: {},
    isDeveloperMode: false,
    hoveredVariableId: null,
    hoveredObjectId: null,

    resetStore: () => {
      clearActiveTimer()
      cancelPendingRequest()
      set({
        executionId: null,
        sessionId: null,
        status: null,
        timeline: [],
        educationalTimeline: [],
        currentStep: null,
        currentFrameIndex: 0,
        totalFrameCount: 0,
        currentModel: null,
        previousModel: null,
        consoleStream: [],
        metadata: null,
        isPlaying: false,
        connectionStatus: 'DISCONNECTED',
        error: null,
        cache: {},
        selectedObjectId: null,
        selectedFrameIndex: null,
        hoveredVariableId: null,
        hoveredObjectId: null,
      })
    },

    loadTraceTimeline: (executionId: string, status: string, timeline: TraceEvent[]) => {
      clearActiveTimer()
      cancelPendingRequest()

      const educationalTimeline = transformToEducationalTimeline(timeline)
      const total = educationalTimeline.length || timeline.length
      const firstStep = educationalTimeline[0]
      const model = firstStep ? firstStep.visualizationState : buildStepVisualizationModel(timeline, 0)
      const consoleStream = firstStep ? firstStep.consoleState : computeConsoleStream(timeline, 0)

      set({
        executionId,
        sessionId: executionId,
        status,
        timeline,
        educationalTimeline,
        currentStep: firstStep || null,
        currentFrameIndex: 0,
        totalFrameCount: total,
        currentModel: model,
        previousModel: null,
        consoleStream,
        isPlaying: false,
        connectionStatus: 'CONNECTED',
        metadata: {
          totalSteps: total,
          currentStepIndex: 0,
          progressPercentage: 0,
        },
      })
    },

    jumpToFrame: (index: number) => {
      updateFrameIndex(index)
    },

    stepNext: () => {
      const { currentFrameIndex, totalFrameCount } = get()
      if (currentFrameIndex < totalFrameCount - 1) {
        updateFrameIndex(currentFrameIndex + 1)
      }
    },

    stepPrev: () => {
      const { currentFrameIndex } = get()
      if (currentFrameIndex > 0) {
        updateFrameIndex(currentFrameIndex - 1)
      }
    },

    firstFrame: () => {
      updateFrameIndex(0)
    },

    lastFrame: () => {
      const { totalFrameCount } = get()
      if (totalFrameCount > 0) {
        updateFrameIndex(totalFrameCount - 1)
      }
    },

    stop: () => {
      clearActiveTimer()
      set({ isPlaying: false })
      updateFrameIndex(0)
    },

    loadSession: async (sessionId: string) => {
      clearActiveTimer()
      cancelPendingRequest()

      set({
        sessionId,
        connectionStatus: 'CONNECTING',
        error: null,
        cache: {},
        currentModel: null,
        previousModel: null,
        metadata: null,
        isPlaying: false,
        selectedObjectId: null,
        selectedFrameIndex: null,
      })

      const controller = new AbortController()
      set({ abortController: controller })

      try {
        const response: PlaybackResponse = await get().client.loadSession(
          sessionId,
          controller.signal,
        )
        set({
          connectionStatus: 'CONNECTED',
          currentModel: response.model,
          metadata: response.metadata,
          cache: { 0: response.model },
          abortController: null,
        })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        set({
          connectionStatus: 'DISCONNECTED',
          error: err instanceof Error ? err.message : 'Failed to load session',
          abortController: null,
        })
        throw err
      }
    },

    stepForward: async () => {
      const { timeline, sessionId, metadata, cache, client, currentModel } = get()
      if (timeline.length > 0) {
        get().stepNext()
        return
      }

      if (!sessionId || !metadata) return
      const nextIndex = metadata.currentStepIndex + 1
      if (nextIndex >= metadata.totalSteps) return

      cancelPendingRequest()

      if (cache[nextIndex]) {
        set({
          previousModel: currentModel,
          currentModel: cache[nextIndex],
          selectedObjectId: null,
          selectedFrameIndex: null,
          metadata: {
            ...metadata,
            currentStepIndex: nextIndex,
            progressPercentage: (nextIndex / (metadata.totalSteps - 1 || 1)) * 100,
          },
        })
        client.seek(sessionId, nextIndex).catch(() => {})
        return
      }

      const controller = new AbortController()
      set({ abortController: controller })

      try {
        const response = await client.stepForward(sessionId, controller.signal)
        set({
          previousModel: currentModel,
          currentModel: response.model,
          metadata: response.metadata,
          selectedObjectId: null,
          selectedFrameIndex: null,
          cache: {
            ...cache,
            [nextIndex]: response.model,
          },
          abortController: null,
        })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        set({
          error: err instanceof Error ? err.message : 'Step forward failed',
          abortController: null,
        })
        throw err
      }
    },

    stepBackward: async () => {
      const { timeline, sessionId, metadata, cache, client } = get()
      if (timeline.length > 0) {
        get().stepPrev()
        return
      }

      if (!sessionId || !metadata) return
      const prevIndex = metadata.currentStepIndex - 1
      if (prevIndex < 0) return

      cancelPendingRequest()

      if (cache[prevIndex]) {
        set({
          previousModel: cache[prevIndex - 1] || null,
          currentModel: cache[prevIndex],
          selectedObjectId: null,
          selectedFrameIndex: null,
          metadata: {
            ...metadata,
            currentStepIndex: prevIndex,
            progressPercentage: (prevIndex / (metadata.totalSteps - 1 || 1)) * 100,
          },
        })
        client.seek(sessionId, prevIndex).catch(() => {})
        return
      }

      const controller = new AbortController()
      set({ abortController: controller })

      try {
        const response = await client.stepBackward(sessionId, controller.signal)
        set({
          previousModel: cache[prevIndex - 1] || null,
          currentModel: response.model,
          metadata: response.metadata,
          selectedObjectId: null,
          selectedFrameIndex: null,
          cache: {
            ...cache,
            [prevIndex]: response.model,
          },
          abortController: null,
        })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        set({
          error: err instanceof Error ? err.message : 'Step backward failed',
          abortController: null,
        })
        throw err
      }
    },

    seek: async (index: number) => {
      const { timeline, sessionId, metadata, cache, client } = get()
      if (timeline.length > 0) {
        get().jumpToFrame(index)
        return
      }

      if (!sessionId || !metadata) return
      if (index < 0 || index >= metadata.totalSteps) return

      cancelPendingRequest()

      if (cache[index]) {
        set({
          previousModel: cache[index - 1] || null,
          currentModel: cache[index],
          selectedObjectId: null,
          selectedFrameIndex: null,
          metadata: {
            ...metadata,
            currentStepIndex: index,
            progressPercentage: (index / (metadata.totalSteps - 1 || 1)) * 100,
          },
        })
        client.seek(sessionId, index).catch(() => {})
        return
      }

      const controller = new AbortController()
      set({ abortController: controller })

      try {
        const response = await client.seek(sessionId, index, controller.signal)
        set({
          previousModel: cache[index - 1] || null,
          currentModel: response.model,
          metadata: response.metadata,
          selectedObjectId: null,
          selectedFrameIndex: null,
          cache: {
            ...cache,
            [index]: response.model,
          },
          abortController: null,
        })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        set({
          error: err instanceof Error ? err.message : 'Seek failed',
          abortController: null,
        })
        throw err
      }
    },

    togglePlay: () => {
      const { isPlaying } = get()
      if (isPlaying) {
        clearActiveTimer()
        set({ isPlaying: false })
      } else {
        set({ isPlaying: true })
        runAutoStepLoop()
      }
    },

    setSpeed: (speed: number) => {
      set({ playSpeed: speed })
      const { isPlaying } = get()
      if (isPlaying) {
        clearActiveTimer()
        runAutoStepLoop()
      }
    },

    restart: async () => {
      const { timeline, sessionId, client, cache } = get()
      if (timeline.length > 0) {
        get().stop()
        return
      }

      if (!sessionId) return

      clearActiveTimer()
      cancelPendingRequest()

      if (cache[0]) {
        set({
          currentModel: cache[0],
          previousModel: null,
          isPlaying: false,
          selectedObjectId: null,
          selectedFrameIndex: null,
        })
        if (get().metadata) {
          set({
            metadata: {
              ...get().metadata!,
              currentStepIndex: 0,
              progressPercentage: 0,
            },
          })
        }
      }

      const controller = new AbortController()
      set({ abortController: controller })

      try {
        const response = await client.restart(sessionId, controller.signal)
        set({
          currentModel: response.model,
          previousModel: null,
          metadata: response.metadata,
          selectedObjectId: null,
          selectedFrameIndex: null,
          cache: {
            ...cache,
            0: response.model,
          },
          isPlaying: false,
          abortController: null,
        })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        set({
          error: err instanceof Error ? err.message : 'Restart failed',
          abortController: null,
        })
        throw err
      }
    },

    clearError: () => set({ error: null }),
    setSelectedObjectId: (id: string | null) => set({ selectedObjectId: id }),
    setSelectedFrameIndex: (index: number | null) => set({ selectedFrameIndex: index }),

    toggleObjectExpanded: (objectId: string) => {
      const { expandedObjects } = get()
      const current = expandedObjects[objectId] !== false // default expanded is true
      set({
        expandedObjects: {
          ...expandedObjects,
          [objectId]: !current,
        },
      })
    },

    setObjectExpanded: (objectId: string, expanded: boolean) => {
      const { expandedObjects } = get()
      set({
        expandedObjects: {
          ...expandedObjects,
          [objectId]: expanded,
        },
      })
    },

    setIsDeveloperMode: (isDev: boolean) => set({ isDeveloperMode: isDev }),
    setHoveredVariableId: (id: string | null) => set({ hoveredVariableId: id }),
    setHoveredObjectId: (id: string | null) => set({ hoveredObjectId: id }),

    destroy: () => {
      clearActiveTimer()
      cancelPendingRequest()
      set({
        sessionId: null,
        executionId: null,
        status: null,
        timeline: [],
        currentFrameIndex: 0,
        totalFrameCount: 0,
        currentModel: null,
        previousModel: null,
        metadata: null,
        isPlaying: false,
        playSpeed: 1.0,
        connectionStatus: 'DISCONNECTED',
        error: null,
        cache: {},
        abortController: null,
        selectedObjectId: null,
        selectedFrameIndex: null,
        expandedObjects: {},
      })
    },
  }
})
