import { describe, it, expect, vi, beforeEach } from 'vitest'
import { healthService } from './healthService'
import { axiosClient } from '../axiosClient'

vi.mock('../axiosClient', () => ({
  axiosClient: {
    get: vi.fn(),
  },
}))

describe('healthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch health status from GET /api/v1/health', async () => {
    const mockHealthData = {
      status: 'UP',
      application: 'Execution Studio Backend',
      version: '1.0.0',
    }
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockHealthData })

    const result = await healthService.getHealthStatus()

    expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/health')
    expect(result).toEqual(mockHealthData)
  })
})
