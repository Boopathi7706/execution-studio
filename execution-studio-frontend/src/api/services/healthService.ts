import { axiosClient } from '../axiosClient'

export interface HealthStatusResponse {
  status: string
  application: string
  version: string
}

/**
 * Service encapsulating Health Endpoint calls to backend.
 */
export const healthService = {
  async getHealthStatus(): Promise<HealthStatusResponse> {
    const response = await axiosClient.get<HealthStatusResponse>('/api/v1/health')
    return response.data
  },
}
