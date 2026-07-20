import { create } from 'zustand'
import type { VisualizationModel, PlaybackResponse } from '@/types/visualization.types'
import type { PlaybackMetadata } from '@/types/metadata.types'
import { PlaybackClient } from '@/api/PlaybackClient'

interface PlaybackState {
  // State
  sessionId: string | null
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

  // Internal references
  client: PlaybackClient
  playTimerId: ReturnType<typeof setTimeout> | null
  abortController: AbortController | null

  // Actions
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
}

/**
 * Zustand state store governing visual timeline playback operations.
 * Connects directly to PlaybackClient REST endpoints.
 */
export const usePlaybackStore = create<PlaybackState>((set, get) => {
  // Helper to trigger stepping loops
  const runAutoStepLoop = () => {
    const { isPlaying, playSpeed, stepForward, togglePlay, metadata } = get()
    if (!isPlaying) return

    // If we've reached the end, stop playing
    if (metadata && metadata.currentStepIndex >= metadata.totalSteps - 1) {
      togglePlay()
      return
    }

    const timerId = setTimeout(async () => {
      try {
        await stepForward()
        // Queue next step if we're still playing
        runAutoStepLoop()
      } catch (err: unknown) {
        set({ error: err instanceof Error ? err.message : 'Auto-step failure' })
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

  return {
    // Initial State
    sessionId: null,
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

    // Actions
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
      const { sessionId, metadata, cache, client, currentModel } = get()
      if (!sessionId || !metadata) return

      const nextIndex = metadata.currentStepIndex + 1
      if (nextIndex >= metadata.totalSteps) return

      cancelPendingRequest()

      // 1. Check cache first
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
        // Background sync index on server without blocking UI
        client.seek(sessionId, nextIndex).catch(() => {})
        return
      }

      // 2. Fetch from network
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
      const { sessionId, metadata, cache, client } = get()
      if (!sessionId || !metadata) return

      const prevIndex = metadata.currentStepIndex - 1
      if (prevIndex < 0) return

      cancelPendingRequest()

      // 1. Check cache first
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

      // 2. Fetch from network
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
      const { sessionId, metadata, cache, client } = get()
      if (!sessionId || !metadata) return
      if (index < 0 || index >= metadata.totalSteps) return

      cancelPendingRequest()

      // 1. Check cache first for instant seek
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

      // 2. Fetch from network
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
      const { sessionId, client, cache } = get()
      if (!sessionId) return

      clearActiveTimer()
      cancelPendingRequest()

      // If we have step 0 cached, we can instantly update UI before calling REST
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

    destroy: () => {
      clearActiveTimer()
      cancelPendingRequest()
      set({
        sessionId: null,
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
      })
    },
  }
})
