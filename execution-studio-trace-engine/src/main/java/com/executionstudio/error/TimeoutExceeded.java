package com.executionstudio.error;

/**
 * Thrown when the wall-clock execution timeout is exceeded.
 *
 * <p>Contains the elapsed time and the step count at the point of timeout.</p>
 */
public class TimeoutExceeded extends TraceEngineException {

    private final long elapsedMs;
    private final int stepCount;

    public TimeoutExceeded(long elapsedMs, int stepCount) {
        super(String.format("Execution timeout exceeded: %dms elapsed, %d steps completed", elapsedMs, stepCount));
        this.elapsedMs = elapsedMs;
        this.stepCount = stepCount;
    }

    public long getElapsedMs() {
        return elapsedMs;
    }

    public int getStepCount() {
        return stepCount;
    }
}
