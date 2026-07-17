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
 * Integration test verifying uncaught exception handling.
 */
class UncaughtExceptionTraceTest {

    @TempDir
    Path tempDir;

    @Test
    void shouldCaptureUncaughtException() throws Exception {
        Path sourceFile = Path.of("src/test/resources/fixtures/ThrowsException.java").toAbsolutePath();
        Path outputFile = tempDir.resolve("exception-trace.json");

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

        // Should have terminated due to uncaught exception
        assertThat(trace.metadata().terminationReason()).isEqualTo("uncaught_exception");

        // Should have some line events before the exception
        assertThat(trace.events()).isNotEmpty();

        // The last event should be an exception event
        TraceEvent lastEvent = trace.events().get(trace.events().size() - 1);
        assertThat(lastEvent.type()).isEqualTo("exception");
        assertThat(lastEvent.exceptionType()).isEqualTo("java.lang.ArithmeticException");
        assertThat(lastEvent.exceptionMessage()).isEqualTo("/ by zero");

        // All non-exception events should be line events
        List<TraceEvent> lineEvents = trace.events().stream()
            .filter(e -> e.type().equals("line"))
            .toList();
        assertThat(lineEvents).isNotEmpty();
    }
}
