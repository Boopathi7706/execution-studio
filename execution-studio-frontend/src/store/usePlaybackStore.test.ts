import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePlaybackStore } from './usePlaybackStore'
import type { PlaybackResponse, VisualizationModel } from '@/types/visualization.types'
import type { PlaybackMetadata } from '@/types/metadata.types'

// Mock PlaybackClient methods
vi.mock('@/api/PlaybackClient', () => {
  return {
    PlaybackClient: class {
      loadSession = vi.fn().mockResolvedValue({})
      stepForward = vi.fn().mockResolvedValue({})
      stepBackward = vi.fn().mockResolvedValue({})
      seek = vi.fn().mockResolvedValue({})
      restart = vi.fn().mockResolvedValue({})
    },
  }
})

const mockModel = (label: string): VisualizationModel => ({
  stack: { frames: [] },
  heap: { objects: {} },
  variables: { variables: [] },
  graph: { nodes: [{ id: 'n1', label, type: 'OBJECT' }], edges: [] },
  highlights: {
    currentLine: 1,
    currentMethod: 'main',
    currentStackFrame: 'Main',
    activeHighlights: [],
  },
  status: 'RUNNING',
})

const mockMetadata = (index: number, total: number = 10): PlaybackMetadata => ({
  currentStepIndex: index,
  totalSteps: total,
  progressPercentage: (index / (total - 1 || 1)) * 100,
})

describe('usePlaybackStore Zustand Store', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clientMock: any

  beforeEach(() => {
    vi.clearAllMocks()
    usePlaybackStore.getState().destroy()
    clientMock = usePlaybackStore.getState().client
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('initializes with default state values', () => {
    const state = usePlaybackStore.getState()
    expect(state.sessionId).toBeNull()
    expect(state.currentModel).toBeNull()
    expect(state.previousModel).toBeNull()
    expect(state.metadata).toBeNull()
    expect(state.isPlaying).toBe(false)
    expect(state.playSpeed).toBe(1.0)
    expect(state.connectionStatus).toBe('DISCONNECTED')
    expect(state.error).toBeNull()
    expect(state.cache).toEqual({})
  })

  it('loads session and updates state + cache on success', async () => {
    const mockResponse: PlaybackResponse = {
      model: mockModel('Step 0'),
      metadata: mockMetadata(0),
    }
    clientMock.loadSession.mockResolvedValueOnce(mockResponse)

    const promise = usePlaybackStore.getState().loadSession('session-123')

    // Connection status should be CONNECTING immediately
    expect(usePlaybackStore.getState().connectionStatus).toBe('CONNECTING')

    await promise

    const state = usePlaybackStore.getState()
    expect(state.sessionId).toBe('session-123')
    expect(state.connectionStatus).toBe('CONNECTED')
    expect(state.currentModel).toEqual(mockResponse.model)
    expect(state.metadata).toEqual(mockResponse.metadata)
    expect(state.cache[0]).toEqual(mockResponse.model)
  })

  it('handles loadSession connection failure gracefully', async () => {
    clientMock.loadSession.mockRejectedValueOnce(new Error('Connection timed out'))

    await expect(usePlaybackStore.getState().loadSession('session-123')).rejects.toThrow(
      'Connection timed out',
    )

    const state = usePlaybackStore.getState()
    expect(state.connectionStatus).toBe('DISCONNECTED')
    expect(state.error).toBe('Connection timed out')
  })

  it('steps forward and caches new steps on demand', async () => {
    // 1. Setup session loaded at index 0
    const step0Model = mockModel('Step 0')
    usePlaybackStore.setState({
      sessionId: 'session-123',
      connectionStatus: 'CONNECTED',
      currentModel: step0Model,
      metadata: mockMetadata(0, 5),
      cache: { 0: step0Model },
    })

    // 2. Mock stepForward to return step 1
    const step1Model = mockModel('Step 1')
    const step1Response: PlaybackResponse = {
      model: step1Model,
      metadata: mockMetadata(1, 5),
    }
    clientMock.stepForward.mockResolvedValueOnce(step1Response)

    await usePlaybackStore.getState().stepForward()

    const state = usePlaybackStore.getState()
    expect(state.previousModel).toEqual(step0Model)
    expect(state.currentModel).toEqual(step1Model)
    expect(state.metadata?.currentStepIndex).toBe(1)
    expect(state.cache[1]).toEqual(step1Model)
    expect(clientMock.stepForward).toHaveBeenCalledTimes(1)
  })

  it('reads from cache for already-visited steps and avoids network calls', async () => {
    const step0Model = mockModel('Step 0')
    const step1Model = mockModel('Step 1')
    usePlaybackStore.setState({
      sessionId: 'session-123',
      connectionStatus: 'CONNECTED',
      currentModel: step0Model,
      metadata: mockMetadata(0, 5),
      cache: { 0: step0Model, 1: step1Model },
    })

    clientMock.seek.mockResolvedValueOnce({})

    // Trigger stepForward (should hit cache[1])
    await usePlaybackStore.getState().stepForward()

    const state = usePlaybackStore.getState()
    expect(state.currentModel).toEqual(step1Model)
    expect(state.metadata?.currentStepIndex).toBe(1)

    // Should NOT call stepForward API
    expect(clientMock.stepForward).not.toHaveBeenCalled()
    // Should trigger background sync seek
    expect(clientMock.seek).toHaveBeenCalledWith('session-123', 1)
  })

  it('seeks to indexes, calling network when uncached and instantly using cache when available', async () => {
    const step0Model = mockModel('Step 0')
    const step5Model = mockModel('Step 5')
    usePlaybackStore.setState({
      sessionId: 'session-123',
      connectionStatus: 'CONNECTED',
      currentModel: step0Model,
      metadata: mockMetadata(0, 10),
      cache: { 0: step0Model },
    })

    const seekResponse: PlaybackResponse = {
      model: step5Model,
      metadata: mockMetadata(5, 10),
    }
    clientMock.seek.mockResolvedValueOnce(seekResponse)

    // Call seek (index 5) - UNCached
    await usePlaybackStore.getState().seek(5)

    let state = usePlaybackStore.getState()
    expect(state.currentModel).toEqual(step5Model)
    expect(state.cache[5]).toEqual(step5Model)

    // Seek back to 0 - CACHED (instant)
    clientMock.seek.mockClear()
    await usePlaybackStore.getState().seek(0)

    state = usePlaybackStore.getState()
    expect(state.currentModel).toEqual(step0Model)
    expect(clientMock.seek).toHaveBeenCalledTimes(1) // background sync seek called once
  })

  it('toggles playing state and registers timer loops for auto stepping', async () => {
    const step0Model = mockModel('Step 0')
    const step1Model = mockModel('Step 1')
    usePlaybackStore.setState({
      sessionId: 'session-123',
      connectionStatus: 'CONNECTED',
      currentModel: step0Model,
      metadata: mockMetadata(0, 5),
      cache: { 0: step0Model },
    })

    clientMock.stepForward.mockResolvedValueOnce({
      model: step1Model,
      metadata: mockMetadata(1, 5),
    })

    // Start playing
    usePlaybackStore.getState().togglePlay()
    expect(usePlaybackStore.getState().isPlaying).toBe(true)

    // Fast-forward timers by 1000ms
    await vi.advanceTimersByTimeAsync(1000)

    expect(usePlaybackStore.getState().currentModel).toEqual(step1Model)
    expect(clientMock.stepForward).toHaveBeenCalledTimes(1)

    // Stop playing
    usePlaybackStore.getState().togglePlay()
    expect(usePlaybackStore.getState().isPlaying).toBe(false)
  })

  it('updates loop timers immediately when speed is adjusted during active playing', async () => {
    const step0Model = mockModel('Step 0')
    const step1Model = mockModel('Step 1')
    usePlaybackStore.setState({
      sessionId: 'session-123',
      connectionStatus: 'CONNECTED',
      currentModel: step0Model,
      metadata: mockMetadata(0, 5),
      cache: { 0: step0Model },
      isPlaying: true,
    })

    clientMock.stepForward.mockResolvedValueOnce({
      model: step1Model,
      metadata: mockMetadata(1, 5),
    })

    // Change speed to 2.0x (should trigger auto-step loop inside 500ms instead of 1000ms)
    usePlaybackStore.getState().setSpeed(2.0)
    expect(usePlaybackStore.getState().playSpeed).toBe(2.0)

    await vi.advanceTimersByTimeAsync(500)

    expect(usePlaybackStore.getState().currentModel).toEqual(step1Model)
    expect(clientMock.stepForward).toHaveBeenCalledTimes(1)
  })

  it('restarts player state back to step 0', async () => {
    const step0Model = mockModel('Step 0')
    const step3Model = mockModel('Step 3')
    usePlaybackStore.setState({
      sessionId: 'session-123',
      connectionStatus: 'CONNECTED',
      currentModel: step3Model,
      metadata: mockMetadata(3, 5),
      cache: { 0: step0Model, 3: step3Model },
      isPlaying: true,
    })

    clientMock.restart.mockResolvedValueOnce({
      model: step0Model,
      metadata: mockMetadata(0, 5),
    })

    await usePlaybackStore.getState().restart()

    const state = usePlaybackStore.getState()
    expect(state.currentModel).toEqual(step0Model)
    expect(state.previousModel).toBeNull()
    expect(state.metadata?.currentStepIndex).toBe(0)
    expect(state.isPlaying).toBe(false)
  })
})
