package com.executionstudio.error;

/**
 * Base exception for all Execution Studio Trace Engine errors.
 *
 * <p>All domain-specific exceptions extend this class, allowing callers to catch
 * a single type for any engine-related failure while still being able to distinguish
 * specific failure modes via subclasses.</p>
 */
public class TraceEngineException extends Exception {

    public TraceEngineException(String message) {
        super(message);
    }

    public TraceEngineException(String message, Throwable cause) {
        super(message, cause);
    }
}
