package com.executionstudio.integration;

import com.executionstudio.cli.TraceEngineApp;
import com.executionstudio.config.EngineConfig;
import com.executionstudio.trace.model.ExecutionTrace;
import com.executionstudio.trace.model.TraceEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test that runs the full trace engine against Sample.java
 * and validates the output trace.
 */
class SampleProgramTraceTest {

    @TempDir
    Path tempDir;

    @Test
    void shouldProduceValidTraceForSampleProgram() throws Exception {
        Path sourceFile = Path.of("src/test/resources/fixtures/Sample.java").toAbsolutePath();
        Path outputFile = tempDir.resolve("trace.json");

        EngineConfig config = EngineConfig.builder()
            .sourceFile(sourceFile)
            .outputFile(outputFile)
            .stepLimit(10000)
            .timeoutSeconds(30)
            .build();

        TraceEngineApp app = new TraceEngineApp();
        app.run(config);

        // Parse the output trace
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        ExecutionTrace trace = mapper.readValue(outputFile.toFile(), ExecutionTrace.class);

        // Basic structure validation
        assertThat(trace.schemaVersion()).isEqualTo("1.0.0");
        assertThat(trace.metadata()).isNotNull();
        assertThat(trace.metadata().terminationReason()).isEqualTo("normal_exit");
        assertThat(trace.metadata().sourceFile()).isEqualTo("Sample.java");
        assertThat(trace.metadata().mainClass()).isEqualTo("Sample");
        assertThat(trace.events()).isNotEmpty();
        assertThat(trace.statistics()).isNotNull();

        // All events should be in user classes only (no JDK internals)
        for (TraceEvent event : trace.events()) {
            assertThat(event.className())
                .as("Event at line %d should be a user class", event.lineNumber())
                .isIn("Sample", "Point");
        }

        // Verify events have monotonically increasing sequence numbers
        for (int i = 1; i < trace.events().size(); i++) {
            assertThat(trace.events().get(i).seq())
                .isGreaterThan(trace.events().get(i - 1).seq());
        }

        // All events should be of type "line" (no exceptions in Sample.java)
        for (TraceEvent event : trace.events()) {
            assertThat(event.type()).isEqualTo("line");
        }

        // Verify loop iterations: the for-loop body (line with sum += arr[i])
        // should appear 3 times
        long loopBodyCount = trace.events().stream()
            .filter(e -> e.className().equals("Sample") && e.lineNumber() == 12)
            .count();
        assertThat(loopBodyCount)
            .as("Loop body (sum += arr[i]) should execute 3 times")
            .isEqualTo(3);

        // Verify call stack depth during square() call
        List<TraceEvent> squareEvents = trace.events().stream()
            .filter(e -> e.methodName().equals("square"))
            .toList();
        assertThat(squareEvents).isNotEmpty();
        for (TraceEvent squareEvent : squareEvents) {
            assertThat(squareEvent.callStack().size())
                .as("Call stack during square() should have depth >= 2 (square + main)")
                .isGreaterThanOrEqualTo(2);
            assertThat(squareEvent.callStack().get(0).methodName()).isEqualTo("square");
        }

        // Verify Point constructor events
        List<TraceEvent> pointInitEvents = trace.events().stream()
            .filter(e -> e.className().equals("Point") && e.methodName().equals("<init>"))
            .toList();
        assertThat(pointInitEvents).isNotEmpty();
        for (TraceEvent pointEvent : pointInitEvents) {
            assertThat(pointEvent.callStack().size())
                .as("Call stack during Point.<init> should have depth >= 2")
                .isGreaterThanOrEqualTo(2);
        }

        // Verify heap contains array and Point objects
        boolean foundArray = trace.events().stream()
            .anyMatch(e -> e.heap() != null && e.heap().values().stream()
                .anyMatch(h -> h.type().equals("array")));
        assertThat(foundArray).as("Should have at least one array on the heap").isTrue();

        boolean foundPointObject = trace.events().stream()
            .anyMatch(e -> e.heap() != null && e.heap().values().stream()
                .anyMatch(h -> h.type().equals("object")
                    && h instanceof com.executionstudio.runtime.events.HeapObject.ObjectSnapshot os
                    && os.className().equals("Point")));
        assertThat(foundPointObject).as("Should have a Point object on the heap").isTrue();
    }
}
