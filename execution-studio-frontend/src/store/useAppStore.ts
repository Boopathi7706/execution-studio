import { create } from 'zustand'
import { healthService, type HealthStatusResponse, traceService } from '../api'

export type BackendConnectionStatus = 'unknown' | 'connected' | 'offline'

export interface AppState {
  // Application Status & Health
  backendStatus: BackendConnectionStatus
  healthInfo: HealthStatusResponse | null

  // Loading & Global Errors
  isHealthChecking: boolean
  isSubmittingTrace: boolean
  globalError: string | null

  // Selected Execution State
  currentExecutionId: string | null
  executionStatus: string | null

  // Future Playback Placeholders
  playbackStatePlaceholder: unknown | null

  // Actions
  checkHealth: () => Promise<void>
  submitTrace: (sourceCode: string, className: string) => Promise<string | null>
  clearError: () => void
  setCurrentExecutionId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  backendStatus: 'unknown',
  healthInfo: null,
  isHealthChecking: false,
  isSubmittingTrace: false,
  globalError: null,
  currentExecutionId: null,
  executionStatus: null,
  playbackStatePlaceholder: null,

  checkHealth: async () => {
    set({ isHealthChecking: true })
    try {
      const data = await healthService.getHealthStatus()
      set({
        backendStatus: 'connected',
        healthInfo: data,
        isHealthChecking: false,
      })
    } catch {
      set({
        backendStatus: 'offline',
        healthInfo: null,
        isHealthChecking: false,
      })
    }
  },

  submitTrace: async (sourceCode: string, className: string) => {
    set({ isSubmittingTrace: true, globalError: null })
    try {
      const res = await traceService.submitTrace({ sourceCode, className })
      set({
        currentExecutionId: res.executionId,
        executionStatus: res.status,
        isSubmittingTrace: false,
      })
      return res.executionId
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Trace submission failed'
      set({
        globalError: message,
        isSubmittingTrace: false,
      })
      return null
    }
  },

  clearError: () => set({ globalError: null }),
  setCurrentExecutionId: (id: string | null) => set({ currentExecutionId: id }),
}))
