import { useState, useCallback } from 'react'
import { parseClassName } from '../utils/classNameParser'
import { useAppStore } from '../store/useAppStore'
import { useTracePolling } from './useTracePolling'
import { usePlaybackStore } from '../store/usePlaybackStore'
import type { TraceStatusResponse } from '../api'

export type ExecutionStage =
  | 'idle'
  | 'submitting'
  | 'compiling'
  | 'polling'
  | 'completed'
  | 'failed'

export function useExecuteTrace() {
  const [stage, setStage] = useState<ExecutionStage>('idle')
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const submitTraceAction = useAppStore((state) => state.submitTrace)
  const loadTraceTimeline = usePlaybackStore((state) => state.loadTraceTimeline)

  const handleSuccess = useCallback(
    (response: TraceStatusResponse) => {
      setStage('completed')
      setErrorMessage(null)
      const events = Array.isArray(response.timeline) ? response.timeline : []
      loadTraceTimeline(response.executionId, response.status, events)
    },
    [loadTraceTimeline],
  )

  const handleError = useCallback((err: string) => {
    setStage('failed')
    setErrorMessage(err)
  }, [])

  const handleStatusUpdate = useCallback((status: string) => {
    if (status === 'RUNNING') {
      setStage('compiling')
    } else if (status === 'QUEUED') {
      setStage('polling')
    }
  }, [])

  useTracePolling({
    executionId,
    enabled: stage === 'submitting' || stage === 'polling' || stage === 'compiling',
    intervalMs: 500,
    timeoutMs: 30000,
    onSuccess: handleSuccess,
    onError: handleError,
    onStatusUpdate: handleStatusUpdate,
  })

  const runCode = useCallback(
    async (sourceCode: string) => {
      setStage('submitting')
      setErrorMessage(null)
      const className = parseClassName(sourceCode)

      const id = await submitTraceAction(sourceCode, className)
      if (id) {
        setExecutionId(id)
        setStage('polling')
      } else {
        setStage('failed')
        setErrorMessage('Failed to submit trace execution to backend.')
      }
    },
    [submitTraceAction],
  )

  return {
    stage,
    executionId,
    errorMessage,
    runCode,
    isExecuting: stage === 'submitting' || stage === 'polling' || stage === 'compiling',
  }
}
