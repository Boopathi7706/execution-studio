import { describe, it, expect, vi, beforeEach } from 'vitest'
import { traceService } from './traceService'
import { axiosClient } from '../axiosClient'

vi.mock('../axiosClient', () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('traceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should submit trace via POST /api/v1/traces', async () => {
    const mockResponse = {
      executionId: 'exec-123',
      status: 'QUEUED',
      timeline: null,
    }
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: mockResponse })

    const result = await traceService.submitTrace({
      sourceCode: 'public class Main {}',
      className: 'Main',
    })

    expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/traces', {
      sourceCode: 'public class Main {}',
      className: 'Main',
    })
    expect(result).toEqual(mockResponse)
  })

  it('should get trace status via GET /api/v1/traces/:id', async () => {
    const mockResponse = {
      executionId: 'exec-123',
      status: 'COMPLETED',
      timeline: [],
    }
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockResponse })

    const result = await traceService.getTraceStatus('exec-123')

    expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/traces/exec-123')
    expect(result).toEqual(mockResponse)
  })
})
