import { create } from 'zustand'
import type { VisualizationModel } from '@/types/visualization.types'
import type { PlaybackMetadata } from '@/types/metadata.types'

interface PlaybackState {
  currentModel: VisualizationModel | null
  previousModel: VisualizationModel | null
  metadata: PlaybackMetadata | null
  isPlaying: boolean
  playSpeed: number
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'

  // Actions placeholders
  loadSession: (sessionId: string) => Promise<void>
  stepForward: () => Promise<void>
  stepBackward: () => Promise<void>
  seek: (index: number) => Promise<void>
  togglePlay: () => void
  setSpeed: (speed: number) => void
}

/**
 * Placeholder store for Zustand state management.
 * Exercises no live implementation in Sprint 1.
 */
export const usePlaybackStore = create<PlaybackState>((_set) => ({
  currentModel: null,
  previousModel: null,
  metadata: null,
  isPlaying: false,
  playSpeed: 1,
  connectionStatus: 'DISCONNECTED',

  loadSession: async (_sessionId) => {
    console.warn('loadSession action not implemented')
  },
  stepForward: async () => {
    console.warn('stepForward action not implemented')
  },
  stepBackward: async () => {
    console.warn('stepBackward action not implemented')
  },
  seek: async (_index) => {
    console.warn('seek action not implemented')
  },
  togglePlay: () => {
    console.warn('togglePlay action not implemented')
  },
  setSpeed: (_speed) => {
    console.warn('setSpeed action not implemented')
  },
}))
