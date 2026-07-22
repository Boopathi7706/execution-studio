// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTracePolling } from './useTracePolling'
import { traceService } from '../api'

vi.mock('../api', () => ({
  traceService: {
    getTraceStatus: vi.fn(),
  },
}))

describe('useTracePolling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should poll status until COMPLETED and invoke onSuccess', async () => {
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const onStatusUpdate = vi.fn()

    vi.mocked(traceService.getTraceStatus)
      .mockResolvedValueOnce({ executionId: 'exec-1', status: 'QUEUED', timeline: null })
      .mockResolvedValueOnce({ executionId: 'exec-1', status: 'COMPLETED', timeline: [] })

    renderHook(() =>
      useTracePolling({
        executionId: 'exec-1',
        enabled: true,
        intervalMs: 500,
        onSuccess,
        onError,
        onStatusUpdate,
      }),
    )

    // Initial poll check
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(traceService.getTraceStatus).toHaveBeenCalledWith('exec-1')
    expect(onStatusUpdate).toHaveBeenCalledWith('QUEUED')

    // Second poll check
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(onStatusUpdate).toHaveBeenCalledWith('COMPLETED')
    expect(onSuccess).toHaveBeenCalledWith({ executionId: 'exec-1', status: 'COMPLETED', timeline: [] })
    expect(onError).not.toHaveBeenCalled()
  })

  it('should stop polling and invoke onError when status is FAILED', async () => {
    const onSuccess = vi.fn()
    const onError = vi.fn()

    vi.mocked(traceService.getTraceStatus).mockResolvedValueOnce({
      executionId: 'exec-1',
      status: 'FAILED',
      timeline: null,
    })

    renderHook(() =>
      useTracePolling({
        executionId: 'exec-1',
        enabled: true,
        onSuccess,
        onError,
      }),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(onError).toHaveBeenCalledWith('Backend trace execution failed.')
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
