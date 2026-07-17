package com.executionstudio.trace.builder;

import com.executionstudio.runtime.events.*;
import com.executionstudio.trace.model.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Full-snapshot trace builder for Spike 01.
 *
 * <p>Each event carries a complete heap snapshot of all objects reachable from
 * that event's stack frames. This favors simplicity, correctness, and debuggability
 * over file size.</p>
 *
 * <p>A future {@code DeltaTraceBuilder} can be created behind the same
 * {@link TraceBuilder} interface to optimize file size via delta encoding.</p>
 */
public class SnapshotTraceBuilder implements TraceBuilder {

    private final List<RuntimeEvent> events = new ArrayList<>();
    private boolean built = false;

    @Override
    public void addEvent(RuntimeEvent event) {
        if (built) {
            throw new IllegalStateException("TraceBuilder has already been built; cannot add more events");
        }
        events.add(event);
    }

    @Override
    public ExecutionTrace build(TraceMetadata metadata, TraceStatistics statistics) {
        built = true;

        List<TraceEvent> traceEvents = events.stream()
            .map(this::toTraceEvent)
            .toList();

        return new ExecutionTrace(
            ExecutionTrace.CURRENT_SCHEMA_VERSION,
            metadata,
            traceEvents,
            statistics
        );
    }

    @Override
    public int eventCount() {
        return events.size();
    }

    private TraceEvent toTraceEvent(RuntimeEvent event) {
        return switch (event) {
            case LineEvent le -> new TraceEvent(
                le.seq(), le.type(),
                le.sourceFile(), le.className(), le.methodName(), le.lineNumber(),
                le.callStack(), le.heap(),
                null, null
            );
            case ExceptionEvent ee -> new TraceEvent(
                ee.seq(), ee.type(),
                ee.sourceFile(), ee.className(), ee.methodName(), ee.lineNumber(),
                ee.callStack(), ee.heap(),
                ee.exceptionType(), ee.exceptionMessage()
            );
        };
    }
}
