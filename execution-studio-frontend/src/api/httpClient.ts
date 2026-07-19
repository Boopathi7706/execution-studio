import { PlaybackApiError, NetworkError } from './errors'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
}

/**
 * Stateless wrapper around global fetch API with custom error transformation.
 */
export class HttpClient {
  private readonly baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
      signal: options.signal,
    }

    if (options.body !== undefined) {
      config.body = JSON.stringify(options.body)
    }

    let response: Response
    try {
      response = await fetch(url, config)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      throw new NetworkError('Network request failed', error as Error)
    }

    if (!response.ok) {
      let bodyText = ''
      let details: unknown
      let code: string | undefined

      try {
        bodyText = await response.text()
        details = JSON.parse(bodyText)
        const detailsObj = details as Record<string, unknown>
        code = (detailsObj?.code || detailsObj?.error) as string | undefined
      } catch {
        details = bodyText || response.statusText
      }

      const detailsObj = details as Record<string, unknown>
      const msg = (detailsObj?.message as string) || `HTTP error ${response.status}: ${response.statusText}`
      throw new PlaybackApiError(response.status, msg, code, details)
    }

    if (response.status === 204) {
      return {} as T
    }

    return (await response.json()) as T
  }

  public get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  public post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body })
  }
}
