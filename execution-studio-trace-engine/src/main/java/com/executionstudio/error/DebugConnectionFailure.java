package com.executionstudio.error;

/**
 * Thrown when the JDI debug connection to the debuggee VM fails or is lost.
 */
public class DebugConnectionFailure extends TraceEngineException {

    public DebugConnectionFailure(String message) {
        super(message);
    }

    public DebugConnectionFailure(String message, Throwable cause) {
        super(message, cause);
    }
}
