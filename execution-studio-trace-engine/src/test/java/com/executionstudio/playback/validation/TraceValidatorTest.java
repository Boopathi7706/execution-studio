package com.executionstudio.playback.validation;

import com.executionstudio.playback.exception.InvalidTraceException;
import com.executionstudio.runtime.events.*;
import com.executionstudio.trace.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TraceValidatorTest {

    private TraceValidator validator;
    private TraceMetadata validMetadata;

    @BeforeEach
    void setUp() {
        validator = new TraceValidator();
        validMetadata = new TraceMetadata(
            Instant.now(),
            "0.1.0",
            "17",
            "Sample.java",
            "Sample",
            100L,
            "normal_exit",
            1,
            0,
            1
        );
    }

    @Test
    void shouldPassValidTrace() {
        List<TraceEvent> events = List.of(
            new TraceEvent(0, "line", "Sample.java", "Sample", "main", 7, List.of(), Map.of(), null, null),
            new TraceEvent(1, "line", "Sample.java", "Sample", "main", 8, List.of(), Map.of(), null, null)
        );

        ExecutionTrace trace = new ExecutionTrace("1.0.0", validMetadata, events, new TraceStatistics(1, 1, 0, 0, 0));

        assertThatCode(() -> validator.validate(trace)).doesNotThrowAnyException();
    }

    @Test
    void shouldRejectUnsupportedSchemaVersion() {
        ExecutionTrace trace = new ExecutionTrace("2.0.0", validMetadata, List.of(), new TraceStatistics(1, 1, 0, 0, 0));

        assertThatThrownBy(() -> validator.validate(trace))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("Unsupported trace schemaVersion");
    }

    @Test
    void shouldRejectMissingSchemaVersion() {
        ExecutionTrace trace = new ExecutionTrace(null, validMetadata, List.of(), new TraceStatistics(1, 1, 0, 0, 0));

        assertThatThrownBy(() -> validator.validate(trace))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("schemaVersion is missing");
    }

    @Test
    void shouldRejectMissingMetadata() {
        ExecutionTrace trace = new ExecutionTrace("1.0.0", null, List.of(), new TraceStatistics(1, 1, 0, 0, 0));

        assertThatThrownBy(() -> validator.validate(trace))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("metadata is missing");
    }

    @Test
    void shouldRejectNonMonotonicSequenceNumbers() {
        List<TraceEvent> events = List.of(
            new TraceEvent(0, "line", "Sample.java", "Sample", "main", 7, List.of(), Map.of(), null, null),
            new TraceEvent(2, "line", "Sample.java", "Sample", "main", 8, List.of(), Map.of(), null, null),
            new TraceEvent(1, "line", "Sample.java", "Sample", "main", 9, List.of(), Map.of(), null, null) // Out of order
        );

        ExecutionTrace trace = new ExecutionTrace("1.0.0", validMetadata, events, new TraceStatistics(1, 1, 0, 0, 0));

        assertThatThrownBy(() -> validator.validate(trace))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("Non-monotonic sequence number detected");
    }

    @Test
    void shouldRejectDuplicateSequenceNumbers() {
        List<TraceEvent> events = List.of(
            new TraceEvent(5, "line", "Sample.java", "Sample", "main", 7, List.of(), Map.of(), null, null),
            new TraceEvent(5, "line", "Sample.java", "Sample", "main", 8, List.of(), Map.of(), null, null) // Duplicate
        );

        ExecutionTrace trace = new ExecutionTrace("1.0.0", validMetadata, events, new TraceStatistics(1, 1, 0, 0, 0));

        assertThatThrownBy(() -> validator.validate(trace))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("Duplicate sequence number detected");
    }

    @Test
    void shouldRejectNegativeSequenceNumbers() {
        List<TraceEvent> events = List.of(
            new TraceEvent(-1, "line", "Sample.java", "Sample", "main", 7, List.of(), Map.of(), null, null)
        );

        ExecutionTrace trace = new ExecutionTrace("1.0.0", validMetadata, events, new TraceStatistics(1, 1, 0, 0, 0));

        assertThatThrownBy(() -> validator.validate(trace))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("negative sequence number");
    }

    @Test
    void shouldRejectBrokenObjectHeapReferences() {
        // Variable references obj_99, but obj_99 is not in the heap map
        FrameSnapshot frame = new FrameSnapshot("Sample", "main", 7, List.of(
            new VariableSnapshot("p", "Point", new HeapValue.ObjectRefValue("obj_99"))
        ));

        List<TraceEvent> events = List.of(
            new TraceEvent(0, "line", "Sample.java", "Sample", "main", 7,
                List.of(frame), Map.of(), null, null) // Empty heap
        );

        ExecutionTrace trace = new ExecutionTrace("1.0.0", validMetadata, events, new TraceStatistics(1, 1, 0, 0, 0));

        assertThatThrownBy(() -> validator.validate(trace))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("Corrupted heap reference: object ID 'obj_99'");
    }

    @Test
    void shouldAcceptStringValueWithoutHeapEntry() {
        // StringValue contains objectId, but it represents an inline string value and is not present in the heap map
        FrameSnapshot frame = new FrameSnapshot("Sample", "main", 7, List.of(
            new VariableSnapshot("s", "String", new HeapValue.StringValue("hello", "obj_10"))
        ));

        List<TraceEvent> events = List.of(
            new TraceEvent(0, "line", "Sample.java", "Sample", "main", 7,
                List.of(frame), Map.of(), null, null) // Empty heap
        );

        ExecutionTrace trace = new ExecutionTrace("1.0.0", validMetadata, events, new TraceStatistics(1, 1, 0, 0, 0));

        // StringValue should be ignored for reference completeness checking
        assertThatCode(() -> validator.validate(trace)).doesNotThrowAnyException();
    }

    @Test
    void shouldRejectNegativeArraySnapshotLength() {
        Map<String, HeapObject> heap = Map.of(
            "obj_1", new HeapObject.ArraySnapshot("int", -5, List.of(), false) // Negative length
        );

        List<TraceEvent> events = List.of(
            new TraceEvent(0, "line", "Sample.java", "Sample", "main", 7, List.of(), heap, null, null)
        );

        ExecutionTrace trace = new ExecutionTrace("1.0.0", validMetadata, events, new TraceStatistics(1, 1, 0, 0, 0));

        assertThatThrownBy(() -> validator.validate(trace))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("negative length");
    }

    @Test
    void shouldRejectHeapArrayElementsExceedingLength() {
        Map<String, HeapObject> heap = Map.of(
            "obj_1", new HeapObject.ArraySnapshot("int", 1, List.of(
                new HeapValue.IntValue(10), new HeapValue.IntValue(20) // 2 elements, declared length 1
            ), false)
        );

        List<TraceEvent> events = List.of(
            new TraceEvent(0, "line", "Sample.java", "Sample", "main", 7, List.of(), heap, null, null)
        );

        ExecutionTrace trace = new ExecutionTrace("1.0.0", validMetadata, events, new TraceStatistics(1, 1, 0, 0, 0));

        assertThatThrownBy(() -> validator.validate(trace))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("exceeding declared length");
    }
}
