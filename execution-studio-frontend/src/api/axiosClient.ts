import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export interface ApiErrorResponse {
  status?: number
  error?: string
  message: string
  path?: string
  timestamp?: string
  details?: unknown
}

export class AppApiError extends Error {
  public readonly status?: number
  public readonly error?: string
  public readonly details?: unknown

  constructor(message: string, status?: number, error?: string, details?: unknown) {
    super(message)
    this.name = 'AppApiError'
    this.status = status
    this.error = error
    this.details = details
  }
}

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request Interceptor
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

// Response Interceptor
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const data = error.response.data
      const message = data?.message || error.message || `HTTP ${error.response.status} Error`
      const apiError = new AppApiError(message, error.response.status, data?.error, data?.details)
      return Promise.reject(apiError)
    } else if (error.request) {
      const networkError = new AppApiError(
        'Backend server is unreachable. Please check backend connection.',
        0,
        'Network Error',
      )
      return Promise.reject(networkError)
    }

    return Promise.reject(new AppApiError(error.message || 'An unexpected error occurred.'))
  },
)
