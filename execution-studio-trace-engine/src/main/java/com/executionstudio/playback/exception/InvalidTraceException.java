package com.executionstudio.playback.exception;

/**
 * Thrown when an execution trace fails validation or is corrupted.
 */
public class InvalidTraceException extends PlaybackException {
    public InvalidTraceException(String message) {
        super(message);
    }

    public InvalidTraceException(String message, Throwable cause) {
        super(message, cause);
    }
}
