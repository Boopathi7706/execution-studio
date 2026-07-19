import type { VisualizationModel, PlaybackResponse } from '@/types/visualization.types'
import type { PlaybackMetadata } from '@/types/metadata.types'
import { HttpClient } from './httpClient'

/**
 * Concrete client for REST queries communicating with the Playback Session endpoints.
 */
export class PlaybackClient {
  private readonly client: HttpClient

  constructor(baseUrl: string = '') {
    this.client = new HttpClient(baseUrl)
  }

  /**
   * Initializes or connects to a playback session on the backend.
   */
  async loadSession(sessionId: string, signal?: AbortSignal): Promise<PlaybackResponse> {
    return this.client.post<PlaybackResponse>('api/sessions/load', { sessionId }, { signal })
  }

  /**
   * Moves the execution state timeline one step forward.
   */
  async stepForward(sessionId: string, signal?: AbortSignal): Promise<PlaybackResponse> {
    return this.client.post<PlaybackResponse>(`api/sessions/${sessionId}/step-forward`, undefined, {
      signal,
    })
  }

  /**
   * Moves the execution state timeline one step backward.
   */
  async stepBackward(sessionId: string, signal?: AbortSignal): Promise<PlaybackResponse> {
    return this.client.post<PlaybackResponse>(
      `api/sessions/${sessionId}/step-backward`,
      undefined,
      { signal },
    )
  }

  /**
   * Seeks the execution state timeline to a specific step index.
   */
  async seek(sessionId: string, index: number, signal?: AbortSignal): Promise<PlaybackResponse> {
    return this.client.post<PlaybackResponse>(
      `api/sessions/${sessionId}/seek`,
      { index },
      { signal },
    )
  }

  /**
   * Restarts the execution state timeline back to step 0.
   */
  async restart(sessionId: string, signal?: AbortSignal): Promise<PlaybackResponse> {
    return this.client.post<PlaybackResponse>(`api/sessions/${sessionId}/restart`, undefined, {
      signal,
    })
  }

  /**
   * Fetches active model snapshot for a specific session and step index.
   */
  async getModel(
    sessionId: string,
    stepIndex: number,
    signal?: AbortSignal,
  ): Promise<VisualizationModel> {
    const res = await this.client.get<PlaybackResponse>(
      `api/sessions/${sessionId}/steps/${stepIndex}`,
      { signal },
    )
    return res.model
  }

  /**
   * Fetches active timeline progress metadata.
   */
  async getMetadata(sessionId: string, signal?: AbortSignal): Promise<PlaybackMetadata> {
    const res = await this.client.get<PlaybackResponse>(`api/sessions/${sessionId}/metadata`, {
      signal,
    })
    return res.metadata
  }
}
