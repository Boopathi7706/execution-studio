/**
 * Custom error class thrown when the backend returns a non-2xx response.
 */
export class PlaybackApiError extends Error {
  public readonly status: number
  public readonly code?: string
  public readonly details?: unknown

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'PlaybackApiError'
    this.status = status
    this.code = code
    this.details = details
    // Restore prototype chain
    Object.setPrototypeOf(this, PlaybackApiError.prototype)
  }
}

/**
 * Thrown when the fetch request fails due to a network connection/DNS failure.
 */
export class NetworkError extends Error {
  constructor(message: string, cause?: Error) {
    super(message)
    this.name = 'NetworkError'
    this.cause = cause
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}
