import { create } from 'zustand'
import type {
  VisualizationModel,
  PlaybackResponse,
  DisplayValue,
  VariableView,
  FrameView,
  HeapObjectView,
} from '@/types/visualization.types'
import type { PlaybackMetadata } from '@/types/metadata.types'
import { PlaybackClient } from '@/api/PlaybackClient'

export interface TraceEvent {
  sequence: number
  sourceFile: string
  className: string
  methodName: string
  lineNumber: number
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
  }[]
  heap?: Record<string, any>
  heapObjects?: Record<string, any>
  exceptionType?: string
  exceptionMessage?: string
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

    return {
      className: f.className || event.className || 'Test',
      methodName: f.methodName || event.methodName || 'main',
      lineNumber: f.lineNumber || event.lineNumber || 1,
      locals,
      isActive: idx === 0,
    }
  })

  // 2. Fallback single frame if callStack array is empty
  if (frames.length === 0 && (event.className || event.methodName || event.lineNumber)) {
    frames.push({
      className: event.className || 'Test',
      methodName: event.methodName || 'main',
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
    status: 'RUNNING',
  }
}

interface PlaybackState {
  // State
  sessionId: string | null
  executionId: string | null
  status: string | null
  timeline: TraceEvent[]
  currentFrameIndex: number
  totalFrameCount: number

  currentModel: VisualizationModel | null
  previousModel: VisualizationModel | null
  metadata: PlaybackMetadata | null
  isPlaying: boolean
  playSpeed: number
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'
  error: string | null
  cache: Record<number, VisualizationModel>
  selectedObjectId: string | null
  selectedFrameIndex: number | null
  expandedObjects: Record<string, boolean>

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
  destroy: () => void
  setSelectedObjectId: (id: string | null) => void
  setSelectedFrameIndex: (index: number | null) => void
  toggleObjectExpanded: (objectId: string) => void
  setObjectExpanded: (objectId: string, expanded: boolean) => void
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
    const { timeline, totalFrameCount, currentModel } = get()
    if (totalFrameCount === 0) return

    const validIndex = Math.max(0, Math.min(index, totalFrameCount - 1))
    const event = timeline[validIndex]
    const model = eventToVisualizationModel(event)

    set({
      currentFrameIndex: validIndex,
      previousModel: currentModel,
      currentModel: model,
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
    client: new PlaybackClient(),
    playTimerId: null,
    abortController: null,
    selectedObjectId: null,
    selectedFrameIndex: null,
    expandedObjects: {},

    loadTraceTimeline: (executionId: string, status: string, timeline: TraceEvent[]) => {
      clearActiveTimer()
      cancelPendingRequest()

      const total = timeline.length
      const initialEvent = timeline[0]
      const model = eventToVisualizationModel(initialEvent)

      set({
        executionId,
        sessionId: executionId,
        status,
        timeline,
        currentFrameIndex: 0,
        totalFrameCount: total,
        currentModel: model,
        previousModel: null,
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
