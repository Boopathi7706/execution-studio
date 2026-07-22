import { axiosClient } from '../axiosClient'

export interface TraceSubmissionRequest {
  sourceCode: string
  className: string
}

export interface TraceStatusResponse {
  executionId: string
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string
  timeline: unknown | null
}

/**
 * Service encapsulating Trace REST API endpoints.
 */
export const traceService = {
  async submitTrace(payload: TraceSubmissionRequest): Promise<TraceStatusResponse> {
    const response = await axiosClient.post<TraceStatusResponse>('/api/v1/traces', payload)
    return response.data
  },

  async getTraceStatus(executionId: string): Promise<TraceStatusResponse> {
    const response = await axiosClient.get<TraceStatusResponse>(`/api/v1/traces/${executionId}`)
    return response.data
  },
}
