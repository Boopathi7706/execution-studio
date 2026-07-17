package com.executionstudio.watchdog;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;

/**
 * Watchdog that enforces step count and wall-clock time limits.
 *
 * <p><b>Responsibility:</b> Track the number of execution steps and elapsed time,
 * providing a check for whether limits have been exceeded.</p>
 *
 * <p><b>Preconditions:</b> {@link #start(int, int)} must be called before any other method.</p>
 * <p><b>Postconditions:</b> After {@link #isExceeded()} returns true, {@link #terminationReason()}
 * provides the reason string for the trace metadata.</p>
 * <p><b>Thread Safety:</b> {@link #isExceeded()} may be called from any thread.
 * {@link #recordStep()} should be called from the event loop thread only.</p>
 * <p><b>Ownership:</b> Owned by {@code ExecutionContext}.</p>
 * <p><b>Failure Conditions:</b> None — this is a passive monitor.</p>
 */
public class Watchdog {

    private static final Logger log = LoggerFactory.getLogger(Watchdog.class);

    private int stepLimit;
    private int timeoutSeconds;
    private volatile int stepCount;
    private Instant startTime;
    private volatile boolean started;

    /**
     * Start the watchdog with the given limits.
     *
     * @param stepLimit      maximum number of execution steps
     * @param timeoutSeconds maximum wall-clock execution time in seconds
     */
    public void start(int stepLimit, int timeoutSeconds) {
        this.stepLimit = stepLimit;
        this.timeoutSeconds = timeoutSeconds;
        this.stepCount = 0;
        this.startTime = Instant.now();
        this.started = true;
        log.debug("Watchdog started: stepLimit={}, timeoutSeconds={}", stepLimit, timeoutSeconds);
    }

    /**
     * Record that one execution step has completed.
     */
    public void recordStep() {
        stepCount++;
    }

    /**
     * Returns the number of steps recorded so far.
     */
    public int getStepCount() {
        return stepCount;
    }

    /**
     * Returns the elapsed time since the watchdog was started.
     */
    public long getElapsedMs() {
        if (startTime == null) return 0;
        return Duration.between(startTime, Instant.now()).toMillis();
    }

    /**
     * Check whether any limit has been exceeded.
     *
     * @return true if the step limit or timeout has been exceeded
     */
    public boolean isExceeded() {
        if (!started) return false;
        return isStepLimitExceeded() || isTimeoutExceeded();
    }

    /**
     * Returns the termination reason if a limit has been exceeded.
     *
     * @return "step_cap_exceeded", "timeout", or "normal_exit" if no limit exceeded
     */
    public String terminationReason() {
        if (isStepLimitExceeded()) {
            return "step_cap_exceeded";
        }
        if (isTimeoutExceeded()) {
            return "timeout";
        }
        return "normal_exit";
    }

    /**
     * Stop the watchdog.
     */
    public void stop() {
        started = false;
        log.debug("Watchdog stopped: {} steps in {}ms", stepCount, getElapsedMs());
    }

    private boolean isStepLimitExceeded() {
        return stepCount >= stepLimit;
    }

    private boolean isTimeoutExceeded() {
        if (startTime == null) return false;
        long elapsedSeconds = Duration.between(startTime, Instant.now()).getSeconds();
        return elapsedSeconds >= timeoutSeconds;
    }
}
