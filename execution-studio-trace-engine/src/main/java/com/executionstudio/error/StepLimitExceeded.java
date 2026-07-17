package com.executionstudio.error;

/**
 * Thrown when the step count limit is exceeded during execution.
 */
public class StepLimitExceeded extends TraceEngineException {

    private final int stepCount;

    public StepLimitExceeded(int stepCount) {
        super(String.format("Step limit exceeded: %d steps completed", stepCount));
        this.stepCount = stepCount;
    }

    public int getStepCount() {
        return stepCount;
    }
}
