package com.executionstudio.playback.loader;

import com.executionstudio.playback.exception.InvalidTraceException;
import com.executionstudio.playback.exception.PlaybackException;
import com.executionstudio.trace.model.ExecutionTrace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TraceLoaderTest {

    private JacksonTraceLoader loader;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        loader = new JacksonTraceLoader();
    }

    @Test
    void shouldLoadValidTraceFile() throws IOException, PlaybackException {
        Path traceFile = tempDir.resolve("valid-trace.json");
        Files.writeString(traceFile, """
            {
              "schemaVersion": "1.0.0",
              "metadata": {
                "generatedAt": "2026-07-15T19:00:00Z",
                "toolVersion": "0.1.0",
                "javaVersion": "17",
                "sourceFile": "Sample.java",
                "mainClass": "Sample",
                "executionDurationMs": 120,
                "terminationReason": "normal_exit",
                "totalEvents": 1,
                "totalObjects": 0,
                "totalFrames": 1
              },
              "events": [
                {
                  "seq": 0,
                  "type": "line",
                  "sourceFile": "Sample.java",
                  "className": "Sample",
                  "methodName": "main",
                  "lineNumber": 7,
                  "callStack": [],
                  "heap": {}
                }
              ],
              "statistics": {
                "maxCallStackDepth": 1,
                "uniqueMethodsExecuted": 1,
                "loopIterationsDetected": 0,
                "objectsCreated": 0,
                "arraysCreated": 0
              }
            }
            """);

        ExecutionTrace trace = loader.load(traceFile);

        assertThat(trace).isNotNull();
        assertThat(trace.schemaVersion()).isEqualTo("1.0.0");
        assertThat(trace.metadata().sourceFile()).isEqualTo("Sample.java");
        assertThat(trace.events()).hasSize(1);
        assertThat(trace.events().get(0).seq()).isEqualTo(0);
    }

    @Test
    void shouldRejectCorruptedJsonFile() throws IOException {
        Path traceFile = tempDir.resolve("corrupted.json");
        Files.writeString(traceFile, "{ invalid json structure ");

        assertThatThrownBy(() -> loader.load(traceFile))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("Failed to read or parse trace JSON");
    }

    @Test
    void shouldRejectInvalidTraceFields() throws IOException {
        Path traceFile = tempDir.resolve("invalid-fields.json");
        Files.writeString(traceFile, """
            {
              "schemaVersion": "1.0.0",
              "metadata": null,
              "events": [],
              "statistics": null
            }
            """);

        assertThatThrownBy(() -> loader.load(traceFile))
            .isInstanceOf(InvalidTraceException.class)
            .hasMessageContaining("metadata is missing");
    }
}
