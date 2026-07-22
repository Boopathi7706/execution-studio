import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAppStore } from './useAppStore'
import { healthService, traceService } from '../api'

vi.mock('../api', () => ({
  healthService: {
    getHealthStatus: vi.fn(),
  },
  traceService: {
    submitTrace: vi.fn(),
    getTraceStatus: vi.fn(),
  },
}))

describe('useAppStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.setState({
      backendStatus: 'unknown',
      healthInfo: null,
      isHealthChecking: false,
      isSubmittingTrace: false,
      globalError: null,
      currentExecutionId: null,
      executionStatus: null,
    })
  })

  it('should update state to connected when health check succeeds', async () => {
    const healthData = {
      status: 'UP',
      application: 'Execution Studio Backend',
      version: '1.0.0',
    }
    vi.mocked(healthService.getHealthStatus).mockResolvedValueOnce(healthData)

    await useAppStore.getState().checkHealth()

    const state = useAppStore.getState()
    expect(state.backendStatus).toBe('connected')
    expect(state.healthInfo).toEqual(healthData)
    expect(state.isHealthChecking).toBe(false)
  })

  it('should update state to offline when health check fails', async () => {
    vi.mocked(healthService.getHealthStatus).mockRejectedValueOnce(new Error('Network error'))

    await useAppStore.getState().checkHealth()

    const state = useAppStore.getState()
    expect(state.backendStatus).toBe('offline')
    expect(state.healthInfo).toBeNull()
    expect(state.isHealthChecking).toBe(false)
  })

  it('should submit trace and update currentExecutionId', async () => {
    vi.mocked(traceService.submitTrace).mockResolvedValueOnce({
      executionId: 'exec-999',
      status: 'QUEUED',
      timeline: null,
    })

    const executionId = await useAppStore.getState().submitTrace('public class Main {}', 'Main')

    const state = useAppStore.getState()
    expect(executionId).toBe('exec-999')
    expect(state.currentExecutionId).toBe('exec-999')
    expect(state.executionStatus).toBe('QUEUED')
    expect(state.isSubmittingTrace).toBe(false)
  })

  it('should handle trace submission failure and set globalError', async () => {
    vi.mocked(traceService.submitTrace).mockRejectedValueOnce(new Error('Compilation failed'))

    const executionId = await useAppStore.getState().submitTrace('public class Bad {}', 'Bad')

    const state = useAppStore.getState()
    expect(executionId).toBeNull()
    expect(state.globalError).toBe('Compilation failed')
    expect(state.isSubmittingTrace).toBe(false)
  })
})
