package com.executionstudio.statistics;

import com.executionstudio.runtime.events.RuntimeEvent;
import com.executionstudio.trace.model.TraceStatistics;

/**
 * Collects execution statistics throughout the trace capture.
 *
 * <p><b>Responsibility:</b> Track metrics (event count, object count, max stack depth,
 * unique methods, etc.) as events are produced, and build a final
 * {@link TraceStatistics} summary.</p>
 *
 * <p><b>Preconditions:</b> Called after each event is produced, before it is added to TraceBuilder.</p>
 * <p><b>Postconditions:</b> {@link #build()} returns an accurate summary of all recorded metrics.
 * After build(), no more metrics may be recorded.</p>
 * <p><b>Thread Safety:</b> Not thread-safe. Called sequentially from the event loop.</p>
 * <p><b>Ownership:</b> Owns the running metric counters.</p>
 * <p><b>Failure Conditions:</b> None.</p>
 */
public interface StatisticsCollector {

    /** Record that an event was produced. */
    void recordEvent(RuntimeEvent event);

    /** Record that a new object was allocated on the heap. */
    void recordObjectCreated();

    /** Record that a new array was allocated on the heap. */
    void recordArrayCreated();

    /** Record the call stack depth for the current event. */
    void recordStackDepth(int depth);

    /** Record that a method was seen during execution. */
    void recordMethodSeen(String methodSignature);

    /** Record a line visit for loop iteration detection. */
    void recordLineVisit(String className, int lineNumber);

    /** Build the final statistics summary. */
    TraceStatistics build();
}
