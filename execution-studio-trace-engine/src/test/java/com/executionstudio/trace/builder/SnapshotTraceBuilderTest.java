package com.executionstudio.trace.builder;

import com.executionstudio.runtime.events.*;
import com.executionstudio.trace.model.*;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SnapshotTraceBuilderTest {

    @Test
    void shouldBuildTraceWithLineEvents() {
        SnapshotTraceBuilder builder = new SnapshotTraceBuilder();

        LineEvent event1 = new LineEvent(0, "Test.java", "Test", "main", 5, List.of(), Map.of());
        LineEvent event2 = new LineEvent(1, "Test.java", "Test", "main", 6, List.of(), Map.of());
        builder.addEvent(event1);
        builder.addEvent(event2);

        TraceMetadata metadata = createMetadata();
        TraceStatistics stats = new TraceStatistics(1, 1, 0, 0, 0);

        ExecutionTrace trace = builder.build(metadata, stats);

        assertThat(trace.schemaVersion()).isEqualTo("1.0.0");
        assertThat(trace.events()).hasSize(2);
        assertThat(trace.events().get(0).seq()).isEqualTo(0);
        assertThat(trace.events().get(0).type()).isEqualTo("line");
        assertThat(trace.events().get(1).seq()).isEqualTo(1);
    }

    @Test
    void shouldBuildTraceWithExceptionEvent() {
        SnapshotTraceBuilder builder = new SnapshotTraceBuilder();

        ExceptionEvent event = new ExceptionEvent(
            0, "Test.java", "Test", "main", 5,
            "java.lang.ArithmeticException", "/ by zero",
            List.of(), Map.of()
        );
        builder.addEvent(event);

        ExecutionTrace trace = builder.build(createMetadata(), new TraceStatistics(1, 1, 0, 0, 0));

        assertThat(trace.events()).hasSize(1);
        assertThat(trace.events().get(0).type()).isEqualTo("exception");
        assertThat(trace.events().get(0).exceptionType()).isEqualTo("java.lang.ArithmeticException");
        assertThat(trace.events().get(0).exceptionMessage()).isEqualTo("/ by zero");
    }

    @Test
    void shouldTrackEventCount() {
        SnapshotTraceBuilder builder = new SnapshotTraceBuilder();
        assertThat(builder.eventCount()).isEqualTo(0);

        builder.addEvent(new LineEvent(0, "Test.java", "Test", "main", 5, List.of(), Map.of()));
        assertThat(builder.eventCount()).isEqualTo(1);

        builder.addEvent(new LineEvent(1, "Test.java", "Test", "main", 6, List.of(), Map.of()));
        assertThat(builder.eventCount()).isEqualTo(2);
    }

    @Test
    void shouldPreserveHeapSnapshotsPerEvent() {
        SnapshotTraceBuilder builder = new SnapshotTraceBuilder();

        Map<String, HeapObject> heap1 = Map.of(
            "obj_1", new HeapObject.ArraySnapshot("int", 3,
                List.of(new HeapValue.IntValue(1), new HeapValue.IntValue(2), new HeapValue.IntValue(3)),
                false)
        );
        Map<String, HeapObject> heap2 = Map.of(
            "obj_1", new HeapObject.ArraySnapshot("int", 3,
                List.of(new HeapValue.IntValue(1), new HeapValue.IntValue(2), new HeapValue.IntValue(3)),
                false),
            "obj_2", new HeapObject.ObjectSnapshot("Point", Map.of(
                "x", new HeapValue.IntValue(5),
                "y", new HeapValue.IntValue(10)))
        );

        builder.addEvent(new LineEvent(0, "Test.java", "Test", "main", 5, List.of(), heap1));
        builder.addEvent(new LineEvent(1, "Test.java", "Test", "main", 6, List.of(), heap2));

        ExecutionTrace trace = builder.build(createMetadata(), new TraceStatistics(1, 1, 0, 1, 1));

        // Each event has its own heap snapshot (full snapshot mode)
        assertThat(trace.events().get(0).heap()).hasSize(1);
        assertThat(trace.events().get(1).heap()).hasSize(2);
    }

    @Test
    void shouldRejectAddAfterBuild() {
        SnapshotTraceBuilder builder = new SnapshotTraceBuilder();
        builder.addEvent(new LineEvent(0, "Test.java", "Test", "main", 5, List.of(), Map.of()));
        builder.build(createMetadata(), new TraceStatistics(1, 1, 0, 0, 0));

        assertThatThrownBy(() ->
            builder.addEvent(new LineEvent(1, "Test.java", "Test", "main", 6, List.of(), Map.of()))
        ).isInstanceOf(IllegalStateException.class);
    }

    private TraceMetadata createMetadata() {
        return new TraceMetadata(
            Instant.now(), "0.1.0", "17", "Test.java", "Test",
            100L, "normal_exit", 1, 0, 1
        );
    }
}
