package com.executionstudio.error;

/**
 * Thrown when the debuggee JVM cannot be launched.
 *
 * <p>Wraps the root cause from JDI's {@code LaunchingConnector.launch()} failure,
 * including the main class name that was being launched.</p>
 */
public class LaunchFailure extends TraceEngineException {

    private final String mainClassName;

    public LaunchFailure(String message, String mainClassName, Throwable cause) {
        super(message, cause);
        this.mainClassName = mainClassName;
    }

    public LaunchFailure(String message, String mainClassName) {
        super(message);
        this.mainClassName = mainClassName;
    }

    public String getMainClassName() {
        return mainClassName;
    }
}
