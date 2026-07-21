package com.executionstudio.service;

import com.executionstudio.api.TraceEngine;
import com.executionstudio.api.TraceRequest;
import com.executionstudio.api.TraceResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class DefaultTraceEngineTest {

    private TraceEngine traceEngine;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        traceEngine = new DefaultTraceEngine();
    }

    @Test
    void shouldSuccessfullyExecutePipelineAndReturnTraceResult() {
        Path sourceFile = Path.of("src/test/resources/fixtures/Sample.java").toAbsolutePath();
        Path outputDirectory = tempDir.resolve("output");

        TraceRequest request = TraceRequest.builder()
            .sourceFile(sourceFile)
            .className("Sample")
            .outputDirectory(outputDirectory)
            .build();

        assertThatCode(() -> {
            TraceResult result = traceEngine.execute(request);

            assertThat(result).isNotNull();
            assertThat(result.traceFile()).exists();
            assertThat(result.timeline()).isNotNull();
            assertThat(result.timeline().lastIndex()).isGreaterThan(0);
            assertThat(result.statistics()).isNotNull();
            assertThat(result.statistics().totalLineEvents()).isGreaterThan(0);
            assertThat(result.statistics().maxStackDepth()).isGreaterThan(0);
        }).doesNotThrowAnyException();
    }
}
