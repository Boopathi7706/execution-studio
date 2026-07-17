package com.executionstudio.trace.builder;

import com.executionstudio.runtime.events.RuntimeEvent;
import com.executionstudio.trace.model.ExecutionTrace;
import com.executionstudio.trace.model.TraceMetadata;
import com.executionstudio.trace.model.TraceStatistics;

/**
 * Accumulates RuntimeEvents and produces a finalized ExecutionTrace.
 *
 * <p><b>Responsibility:</b> Collect execution events in order and assemble them into
 * a complete {@link ExecutionTrace} DTO ready for serialization.</p>
 *
 * <p><b>Preconditions:</b></p>
 * <ul>
 *   <li>Events are added in strict seq order (enforced by SequenceGenerator).</li>
 *   <li>{@link #build(TraceMetadata, TraceStatistics)} is called exactly once,
 *       after all events have been added.</li>
 * </ul>
 *
 * <p><b>Postconditions:</b></p>
 * <ul>
 *   <li>{@link #build(TraceMetadata, TraceStatistics)} returns a complete, immutable
 *       ExecutionTrace with all events, metadata, and statistics.</li>
 *   <li>After build(), no more events may be added.</li>
 * </ul>
 *
 * <p><b>Thread Safety:</b> Not thread-safe. Events are added sequentially from the
 * JDI event loop thread.</p>
 * <p><b>Ownership:</b> The TraceBuilder owns accumulated events until build() transfers
 * ownership to the caller via the returned ExecutionTrace.</p>
 * <p><b>Failure Conditions:</b> Throws IllegalStateException if addEvent() is called
 * after build().</p>
 */
public interface TraceBuilder {

    /**
     * Add a runtime event to the trace.
     *
     * @param event the event to add (must have a seq number from SequenceGenerator)
     */
    void addEvent(RuntimeEvent event);

    /**
     * Build the final ExecutionTrace.
     *
     * @param metadata   the trace metadata
     * @param statistics the computed statistics
     * @return the complete, serializable ExecutionTrace
     */
    ExecutionTrace build(TraceMetadata metadata, TraceStatistics statistics);

    /**
     * Returns the number of events accumulated so far.
     */
    int eventCount();
}
