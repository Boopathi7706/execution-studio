package com.executionstudio.playback.state;

import com.executionstudio.runtime.events.FrameSnapshot;
import com.executionstudio.runtime.events.HeapObject;
import com.executionstudio.runtime.events.HeapValue;
import com.executionstudio.runtime.events.VariableSnapshot;
import com.executionstudio.trace.model.ExecutionTrace;
import com.executionstudio.trace.model.TraceEvent;
import com.executionstudio.trace.model.TraceMetadata;
import com.executionstudio.trace.model.TraceStatistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ExecutionStateBuilderTest {

    private DefaultExecutionStateBuilder builder;
    private ExecutionTrace sampleTrace;

    @BeforeEach
    void setUp() {
        builder = new DefaultExecutionStateBuilder();

        TraceMetadata metadata = new TraceMetadata(
            Instant.now(), "0.1.0", "17", "Sample.java", "Sample",
            120L, "normal_exit", 1, 1, 1
        );

        // Define a mock trace event with variable, nested frame, array, and object snapshots
        VariableSnapshot arrayVar = new VariableSnapshot(
            "arr", "int[]", new HeapValue.ArrayRefValue("obj_1")
        );
        VariableSnapshot pointVar = new VariableSnapshot(
            "p", "Point", new HeapValue.ObjectRefValue("obj_2")
        );
        VariableSnapshot primVar = new VariableSnapshot(
            "a", "int", new HeapValue.IntValue(5)
        );

        FrameSnapshot innerFrame = new FrameSnapshot("Sample", "square", 3, List.of(primVar));
        FrameSnapshot outerFrame = new FrameSnapshot("Sample", "main", 12, List.of(arrayVar, pointVar));

        Map<String, HeapObject> heap = Map.of(
            "obj_1", new HeapObject.ArraySnapshot("int", 3, List.of(
                new HeapValue.IntValue(1), new HeapValue.IntValue(2), new HeapValue.IntValue(3)
            ), false),
            "obj_2", new HeapObject.ObjectSnapshot("Point", Map.of(
                "x", new HeapValue.IntValue(5),
                "y", new HeapValue.IntValue(10)
            ))
        );

        TraceEvent event = new TraceEvent(
            0, "line", "Sample.java", "Sample", "square", 3,
            List.of(innerFrame, outerFrame), heap, null, null
        );

        sampleTrace = new ExecutionTrace(
            "1.0.0", metadata, List.of(event), new TraceStatistics(2, 2, 0, 1, 1)
        );
    }

    @Test
    void shouldReconstructExecutionStateFieldsCorrectly() {
        ExecutionState state = builder.build(sampleTrace, 0);

        assertThat(state).isNotNull();

        // Position Check
        assertThat(state.position().sourceFile()).isEqualTo("Sample.java");
        assertThat(state.position().lineNumber()).isEqualTo(3);

        // Context Check
        assertThat(state.context().currentClass()).isEqualTo("Sample");
        assertThat(state.context().currentMethod()).isEqualTo("square");
        assertThat(state.context().currentEventIndex()).isEqualTo(0);
        assertThat(state.context().exceptionType()).isNull();

        // Stack/Frame States Check
        assertThat(state.stack().frames()).hasSize(2);

        FrameState topFrame = state.stack().frames().get(0);
        assertThat(topFrame.methodName()).isEqualTo("square");
        assertThat(topFrame.locals()).hasSize(1);
        assertThat(topFrame.locals().get(0).name()).isEqualTo("a");
        assertThat(topFrame.locals().get(0).value()).isEqualTo(new HeapValue.IntValue(5));

        FrameState outerFrame = state.stack().frames().get(1);
        assertThat(outerFrame.methodName()).isEqualTo("main");
        assertThat(outerFrame.locals()).hasSize(2);
        assertThat(outerFrame.locals().get(0).name()).isEqualTo("arr");
        assertThat(outerFrame.locals().get(1).name()).isEqualTo("p");

        // Heap State Check
        assertThat(state.heap().objects()).hasSize(2);
        assertThat(state.heap().objects().get("obj_1")).isInstanceOf(HeapObject.ArraySnapshot.class);
        assertThat(state.heap().objects().get("obj_2")).isInstanceOf(HeapObject.ObjectSnapshot.class);
    }
}
