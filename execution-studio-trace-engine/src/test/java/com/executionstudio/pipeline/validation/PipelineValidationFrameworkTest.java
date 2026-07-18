package com.executionstudio.pipeline.validation;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PipelineValidationFrameworkTest {

    @TempDir
    Path tempOutputDir;

    @Test
    void shouldSuccessfullyVerifyAllSampleProgramsThroughFullPipeline() throws IOException {
        Path samplesDir = Path.of("samples");
        
        PipelineValidationFramework framework = new PipelineValidationFramework(samplesDir, tempOutputDir);
        List<ValidationReport> reports = framework.runValidation();

        // Verify that we discovered and processed all sample programs
        assertThat(reports).isNotEmpty();

        for (ValidationReport report : reports) {
            assertThat(report.isCompilationSuccess())
                .as("Compilation of program %s should succeed", report.getProgramName())
                .isTrue();

            assertThat(report.isTraceGenerationSuccess())
                .as("Trace generation of program %s should succeed", report.getProgramName())
                .isTrue();

            assertThat(report.isPlaybackSuccess())
                .as("Playback initialization of program %s should succeed", report.getProgramName())
                .isTrue();

            assertThat(report.isMappingSuccess())
                .as("Visualization mapping of program %s should succeed", report.getProgramName())
                .isTrue();

            assertThat(report.isValidationSuccess())
                .as("Overall validation checks for program %s should pass cleanly. Errors: %s",
                    report.getProgramName(), report.getErrors())
                .isTrue();
        }
    }
}
