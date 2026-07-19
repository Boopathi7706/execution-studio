import type { VisualizationModel } from '@/types/visualization.types'
import type { PlaybackMetadata } from '@/types/metadata.types'

/**
 * Placeholder client for REST queries communicating with the Playback Session.
 */
export class PlaybackClient {
  /**
   * Fetches active model snapshot for step index.
   */
  async getModel(_stepIndex: number): Promise<VisualizationModel> {
    throw new Error('REST API Client not implemented')
  }

  /**
   * Fetches active timeline progress metadata.
   */
  async getMetadata(): Promise<PlaybackMetadata> {
    throw new Error('REST API Client not implemented')
  }
}
