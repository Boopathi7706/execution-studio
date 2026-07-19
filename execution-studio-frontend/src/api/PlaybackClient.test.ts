import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HttpClient } from './httpClient'
import { PlaybackClient } from './PlaybackClient'
import { PlaybackApiError, NetworkError } from './errors'
import type { PlaybackResponse, VisualizationModel } from '@/types/visualization.types'
import type { PlaybackMetadata } from '@/types/metadata.types'

const mockModel: VisualizationModel = {
  stack: { frames: [] },
  heap: { objects: {} },
  variables: { variables: [] },
  graph: { nodes: [], edges: [] },
  highlights: { currentLine: 1, currentMethod: 'main', currentStackFrame: 'Main', activeHighlights: [] },
  status: 'RUNNING'
}

const mockMetadata: PlaybackMetadata = {
  currentStepIndex: 5,
  totalSteps: 10,
  progressPercentage: 50
}

const mockPlaybackResponse: PlaybackResponse = {
  model: mockModel,
  metadata: mockMetadata
}

describe('HttpClient', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('performs successful GET requests and parses JSON response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPlaybackResponse
    } as Response)

    const client = new HttpClient('http://localhost:8080')
    const result = await client.get<PlaybackResponse>('/api/test')

    expect(result).toEqual(mockPlaybackResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  it('performs successful POST requests with JSON payload', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPlaybackResponse
    } as Response)

    const client = new HttpClient('http://localhost:8080')
    const result = await client.post<PlaybackResponse>('/api/test', { key: 'value' })

    expect(result).toEqual(mockPlaybackResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'value' })
      })
    )
  })

  it('throws PlaybackApiError for non-2xx status responses', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => JSON.stringify({ message: 'Invalid index', code: 'ERR_INVALID_INDEX' })
    } as Response)

    const client = new HttpClient('http://localhost:8080')

    await expect(client.get('/api/test')).rejects.toThrow(PlaybackApiError)
    
    try {
      await client.get('/api/test')
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(PlaybackApiError)
      const apiErr = err as PlaybackApiError
      expect(apiErr.status).toBe(400)
      expect(apiErr.code).toBe('ERR_INVALID_INDEX')
      expect(apiErr.message).toBe('Invalid index')
    }
  })

  it('throws NetworkError when request fails at connection level', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const client = new HttpClient('http://localhost:8080')

    await expect(client.get('/api/test')).rejects.toThrow(NetworkError)
  })

  it('propagates AbortError when request is cancelled via AbortSignal', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('The user aborted a request.', 'AbortError')
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(abortError)

    const client = new HttpClient('http://localhost:8080')

    await expect(client.get('/api/test', { signal: controller.signal })).rejects.toThrow('The user aborted a request.')
  })
})

describe('PlaybackClient', () => {
  const originalFetch = globalThis.fetch
  const baseUrl = 'http://localhost:8080'
  let playbackClient: PlaybackClient

  beforeEach(() => {
    globalThis.fetch = vi.fn()
    playbackClient = new PlaybackClient(baseUrl)
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('calls correct endpoint for loadSession', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPlaybackResponse
    } as Response)

    const result = await playbackClient.loadSession('session-123')

    expect(result).toEqual(mockPlaybackResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/sessions/load`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ sessionId: 'session-123' })
      })
    )
  })

  it('calls correct endpoint for stepForward', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPlaybackResponse
    } as Response)

    const result = await playbackClient.stepForward('session-123')

    expect(result).toEqual(mockPlaybackResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/sessions/session-123/step-forward`,
      expect.objectContaining({
        method: 'POST'
      })
    )
  })

  it('calls correct endpoint for stepBackward', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPlaybackResponse
    } as Response)

    const result = await playbackClient.stepBackward('session-123')

    expect(result).toEqual(mockPlaybackResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/sessions/session-123/step-backward`,
      expect.objectContaining({
        method: 'POST'
      })
    )
  })

  it('calls correct endpoint for seek', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPlaybackResponse
    } as Response)

    const result = await playbackClient.seek('session-123', 5)

    expect(result).toEqual(mockPlaybackResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/sessions/session-123/seek`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ index: 5 })
      })
    )
  })

  it('calls correct endpoint for restart', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPlaybackResponse
    } as Response)

    const result = await playbackClient.restart('session-123')

    expect(result).toEqual(mockPlaybackResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/sessions/session-123/restart`,
      expect.objectContaining({
        method: 'POST'
      })
    )
  })
})
