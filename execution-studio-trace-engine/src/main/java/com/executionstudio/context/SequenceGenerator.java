package com.executionstudio.context;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Generates monotonically increasing sequence numbers for execution events.
 *
 * <p><b>Responsibility:</b> Provide a single, authoritative source of sequence IDs
 * for all {@code RuntimeEvent}s within a trace execution.</p>
 *
 * <p><b>Preconditions:</b> None.</p>
 * <p><b>Postconditions:</b> Each call to {@link #next()} returns a value strictly greater
 * than the previous call. First call returns 0.</p>
 * <p><b>Thread Safety:</b> Thread-safe via {@link AtomicInteger}.</p>
 * <p><b>Ownership:</b> Owned by the {@code ExecutionContext} for the lifetime of a trace.</p>
 * <p><b>Failure Conditions:</b> None.</p>
 */
public class SequenceGenerator {

    private final AtomicInteger counter = new AtomicInteger(0);

    /**
     * Returns the next sequence number, starting from 0.
     *
     * @return the next monotonically increasing sequence number
     */
    public int next() {
        return counter.getAndIncrement();
    }

    /**
     * Returns the current count (the next value that would be returned by {@link #next()}).
     *
     * @return the current sequence counter value
     */
    public int current() {
        return counter.get();
    }
}
