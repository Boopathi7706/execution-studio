package com.executionstudio.integration;

import com.executionstudio.cli.TraceEngineApp;
import com.executionstudio.config.EngineConfig;
import com.executionstudio.trace.model.ExecutionTrace;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test verifying the watchdog terminates an infinite loop program.
 *
 * <p>
 * The watchdog may terminate by either step_cap_exceeded or timeout depending
 * on JVM startup timing. Both are valid — the test verifies that execution is
 * bounded, not which specific limit triggered first.
 * </p>
 */
class InfiniteLoopWatchdogTest {

    @TempDir
    Path tempDir;

    /** Valid watchdog termination reasons — either is acceptable. */
    private static final Set<String> WATCHDOG_REASONS = Set.of("step_cap_exceeded", "timeout");

    @Test
    void shouldTerminateInfiniteLoopWithWatchdog() throws Exception {
        Path sourceFile = Path.of("src/test/resources/fixtures/InfiniteLoop.java").toAbsolutePath();
        Path outputFile = tempDir.resolve("infinite-trace.json");

        EngineConfig config = EngineConfig.builder()
                .sourceFile(sourceFile)
                .outputFile(outputFile)
                .stepLimit(500) // Enough steps to distinguish from timeout; low enough to be fast
                .timeoutSeconds(15)
                .build();

        TraceEngineApp app = new TraceEngineApp();
        app.run(config);

        // Parse the output trace
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        ExecutionTrace trace = mapper.readValue(outputFile.toFile(), ExecutionTrace.class);

        // Should have terminated by a watchdog mechanism (not normal_exit or exception)
        assertThat(trace.metadata().terminationReason())
                .as("Infinite loop must be bounded by the watchdog")
                .isIn(WATCHDOG_REASONS);

        // Should have a partial trace with events (proves the engine ran)
        assertThat(trace.events()).isNotEmpty();

        // All events should be valid line events in InfiniteLoop only
        trace.events().forEach(event -> {
            assertThat(event.type()).isEqualTo("line");
            assertThat(event.className()).isEqualTo("InfiniteLoop");
        });
    }
}
