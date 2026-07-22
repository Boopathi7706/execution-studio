package com.executionstudio.service;

import com.executionstudio.api.*;
import com.executionstudio.playback.loader.JacksonTraceLoader;
import com.executionstudio.playback.timeline.DefaultTimeline;
import com.executionstudio.playback.timeline.Timeline;
import com.executionstudio.trace.model.ExecutionTrace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DefaultTraceEngineTest {

    private TraceEngine traceEngine;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        traceEngine = new DefaultTraceEngine();
    }

    @Test
    void shouldSuccessfullyVerifyTraceRequestCreationAndGetters() {
        Path sourceFile = Path.of("Dummy.java");
        Path outputDir = Path.of("output");

        TraceRequest request = TraceRequest.builder()
            .sourceFile(sourceFile)
            .className("Dummy")
            .outputDirectory(outputDir)
            .stepLimit(100)
            .timeoutSeconds(5)
            .build();

        assertThat(request.getSourceFile()).isEqualTo(sourceFile);
        assertThat(request.getClassName()).isEqualTo("Dummy");
        assertThat(request.getOutputDirectory()).isEqualTo(outputDir);
        assertThat(request.getStepLimit()).isEqualTo(100);
        assertThat(request.getTimeoutSeconds()).isEqualTo(5);
    }

    @Test
    void shouldEnforceNonNullChecksOnTraceRequestCreation() {
        assertThatThrownBy(() -> TraceRequest.builder().build())
            .isInstanceOf(NullPointerException.class);

        assertThatThrownBy(() -> TraceRequest.builder()
            .sourceFile(Path.of("Dummy.java"))
            .build())
            .isInstanceOf(NullPointerException.class);
    }

    @Test
    void shouldSuccessfullyVerifyTraceResultCreationAndGetters() {
        Timeline timeline = new DefaultTimeline(5);
        ExecutionStatistics statistics = new ExecutionStatistics(3, 1, 2, 2, 3);
        Path traceFile = Path.of("trace.json");

        TraceResult result = new TraceResult(timeline, statistics, traceFile);

        assertThat(result.timeline()).isEqualTo(timeline);
        assertThat(result.statistics()).isEqualTo(statistics);
        assertThat(result.traceFile()).isEqualTo(traceFile);
    }

    @Test
    void shouldEnforceNonNullChecksOnTraceResultCreation() {
        Timeline timeline = new DefaultTimeline(5);
        ExecutionStatistics statistics = new ExecutionStatistics(3, 1, 2, 2, 3);
        Path traceFile = Path.of("trace.json");

        assertThatThrownBy(() -> new TraceResult(null, statistics, traceFile))
            .isInstanceOf(NullPointerException.class);

        assertThatThrownBy(() -> new TraceResult(timeline, null, traceFile))
            .isInstanceOf(NullPointerException.class);

        assertThatThrownBy(() -> new TraceResult(timeline, statistics, null))
            .isInstanceOf(NullPointerException.class);
    }

    @Test
    void shouldSuccessfullyExecutePipelineAndSerializeTrace() throws Exception {
        Path sourceFile = tempDir.resolve("SimpleMain.java");
        Files.writeString(sourceFile, """
            public class SimpleMain {
                public static void main(String[] args) {
                    int a = 5;
                    int b = 10;
                    int c = a + b;
                }
            }
            """);

        Path outputDirectory = tempDir.resolve("output");

        TraceRequest request = TraceRequest.builder()
            .sourceFile(sourceFile)
            .className("SimpleMain")
            .outputDirectory(outputDirectory)
            .build();

        TraceResult result = traceEngine.execute(request);

        assertThat(result).isNotNull();
        assertThat(result.traceFile()).exists();
        assertThat(result.timeline()).isNotNull();
        assertThat(result.timeline().lastIndex()).isGreaterThan(0);

        // Verify Serialization Success by loading the generated JSON
        ExecutionTrace trace = new JacksonTraceLoader().load(result.traceFile());
        assertThat(trace).isNotNull();
        assertThat(trace.events()).isNotEmpty();
        assertThat(trace.statistics()).isNotNull();

        // Verify statistics mapped correctly
        assertThat(result.statistics()).isNotNull();
        assertThat(result.statistics().totalLineEvents()).isGreaterThan(0);
        assertThat(result.statistics().maxStackDepth()).isEqualTo(1);
    }

    @Test
    void shouldThrowExceptionForInvalidSourceFile() {
        Path nonExistentSource = tempDir.resolve("NonExistent.java");
        Path outputDirectory = tempDir.resolve("output");

        TraceRequest request = TraceRequest.builder()
            .sourceFile(nonExistentSource)
            .className("NonExistent")
            .outputDirectory(outputDirectory)
            .build();

        assertThatThrownBy(() -> traceEngine.execute(request))
            .isInstanceOf(TraceEngineException.class)
            .hasMessageContaining("Trace execution failed");
    }

    @Test
    void shouldThrowExceptionForCompilationFailure() throws IOException {
        Path badSource = tempDir.resolve("BadSource.java");
        Files.writeString(badSource, """
            public class BadSource {
                public static void main(String[] args) {
                    int x = ; // Syntax error
                }
            }
            """);
        Path outputDirectory = tempDir.resolve("output");

        TraceRequest request = TraceRequest.builder()
            .sourceFile(badSource)
            .className("BadSource")
            .outputDirectory(outputDirectory)
            .build();

        assertThatThrownBy(() -> traceEngine.execute(request))
            .isInstanceOf(TraceEngineException.class)
            .hasMessageContaining("Trace execution failed");
    }

    @Test
    void shouldThrowExceptionForRuntimeLauncherFailure() throws IOException {
        Path mainSource = tempDir.resolve("MismatchClass.java");
        // Class name in file is MainClass, but request className is MismatchClass
        Files.writeString(mainSource, """
            public class MainClass {
                public static void main(String[] args) {}
            }
            """);
        Path outputDirectory = tempDir.resolve("output");

        TraceRequest request = TraceRequest.builder()
            .sourceFile(mainSource)
            .className("MismatchClass") // Doesn't match actual class inside file
            .outputDirectory(outputDirectory)
            .build();

        assertThatThrownBy(() -> traceEngine.execute(request))
            .isInstanceOf(TraceEngineException.class)
            .hasMessageContaining("Trace execution failed");
    }
}
