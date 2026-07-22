import { useEffect, useRef } from 'react'
import { traceService, type TraceStatusResponse } from '../api'

export interface UseTracePollingOptions {
  executionId: string | null
  enabled: boolean
  intervalMs?: number
  timeoutMs?: number
  onSuccess: (trace: TraceStatusResponse) => void
  onError: (error: string) => void
  onStatusUpdate?: (status: string) => void
}

/**
 * Reusable custom hook managing REST status polling for asynchronous trace execution.
 * Handles timer cleanup, duplicate polling prevention, cancellation, and timeout.
 */
export function useTracePolling({
  executionId,
  enabled,
  intervalMs = 500,
  timeoutMs = 30000,
  onSuccess,
  onError,
  onStatusUpdate,
}: UseTracePollingOptions) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const isPollingRef = useRef<boolean>(false)

  useEffect(() => {
    if (!enabled || !executionId) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    startTimeRef.current = Date.now()
    isPollingRef.current = true

    const poll = async () => {
      if (!isPollingRef.current) return

      // Check timeout
      if (Date.now() - startTimeRef.current > timeoutMs) {
        isPollingRef.current = false
        if (timerRef.current) clearInterval(timerRef.current)
        onError('Trace execution timed out after 30 seconds.')
        return
      }

      try {
        const response = await traceService.getTraceStatus(executionId)
        if (onStatusUpdate) {
          onStatusUpdate(response.status)
        }

        if (response.status === 'COMPLETED') {
          isPollingRef.current = false
          if (timerRef.current) clearInterval(timerRef.current)
          onSuccess(response)
        } else if (response.status === 'FAILED') {
          isPollingRef.current = false
          if (timerRef.current) clearInterval(timerRef.current)
          onError('Backend trace execution failed.')
        }
      } catch (err: unknown) {
        isPollingRef.current = false
        if (timerRef.current) clearInterval(timerRef.current)
        const msg = err instanceof Error ? err.message : 'Network error during status polling.'
        onError(msg)
      }
    }

    poll()
    timerRef.current = setInterval(poll, intervalMs)

    return () => {
      isPollingRef.current = false
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [executionId, enabled, intervalMs, timeoutMs])
}
