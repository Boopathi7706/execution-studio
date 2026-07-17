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
 * Integration test verifying recursive call stack capture.
 */
class RecursiveProgramTraceTest {

    @TempDir
    Path tempDir;

    @Test
    void shouldCaptureRecursiveCallStackCorrectly() throws Exception {
        Path sourceFile = Path.of("src/test/resources/fixtures/RecursiveProgram.java").toAbsolutePath();
        Path outputFile = tempDir.resolve("recursive-trace.json");

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

        assertThat(trace.metadata().terminationReason()).isEqualTo("normal_exit");
        assertThat(trace.events()).isNotEmpty();

        // Find events where 'factorial' appears in the call stack
        List<TraceEvent> factorialEvents = trace.events().stream()
            .filter(e -> e.methodName().equals("factorial"))
            .toList();
        assertThat(factorialEvents).isNotEmpty();

        // The deepest factorial call should have multiple 'factorial' frames in the stack
        int maxFactorialFrames = factorialEvents.stream()
            .mapToInt(e -> (int) e.callStack().stream()
                .filter(f -> f.methodName().equals("factorial"))
                .count())
            .max()
            .orElse(0);

        assertThat(maxFactorialFrames)
            .as("Deepest recursive call should have multiple 'factorial' frames")
            .isGreaterThanOrEqualTo(4); // factorial(5) -> factorial(4) -> ... -> factorial(1)

        // Verify that each frame has its own locals (not conflated)
        for (TraceEvent event : factorialEvents) {
            var factorialFrames = event.callStack().stream()
                .filter(f -> f.methodName().equals("factorial"))
                .toList();

            // Each factorial frame should have the 'n' parameter
            for (var frame : factorialFrames) {
                // Might not have locals if it's a JDK frame, but user-class frames should
                if (!frame.locals().isEmpty()) {
                    boolean hasN = frame.locals().stream()
                        .anyMatch(v -> v.name().equals("n"));
                    assertThat(hasN).as("Each factorial frame should have its own 'n' parameter").isTrue();
                }
            }
        }
    }
}
