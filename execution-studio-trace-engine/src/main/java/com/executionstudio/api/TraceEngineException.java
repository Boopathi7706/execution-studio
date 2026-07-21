package com.executionstudio.api;

/**
 * Generic exception thrown when compiling, launching, or capturing trace sessions fails.
 */
public class TraceEngineException extends RuntimeException {
    public TraceEngineException(String message) {
        super(message);
    }

    public TraceEngineException(String message, Throwable cause) {
        super(message, cause);
    }
}
