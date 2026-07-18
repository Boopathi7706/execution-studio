package com.executionstudio.cli;

import com.executionstudio.pipeline.validation.PipelineValidationFramework;
import com.executionstudio.pipeline.validation.ValidationReport;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

/**
 * CLI command-line application that runs the backend validation framework.
 *
 * <p>Exercises the full pipeline: Compile -> Trace -> Playback -> Map -> Render for all files in samples/.</p>
 */
public class PipelineValidatorApp {

    public static void main(String[] args) {
        Path samplesDir = Path.of("samples");
        Path outputDir = Path.of("output/validation");

        if (args.length > 0) {
            samplesDir = Path.of(args[0]);
        }
        if (args.length > 1) {
            outputDir = Path.of(args[1]);
        }

        System.out.println("=== EXECUTION STUDIO PIPELINE VALIDATOR ===");
        System.out.println("Samples Directory: " + samplesDir.toAbsolutePath());
        System.out.println("Output Directory:  " + outputDir.toAbsolutePath());
        System.out.println();

        try {
            PipelineValidationFramework framework = new PipelineValidationFramework(samplesDir, outputDir);
            List<ValidationReport> reports = framework.runValidation();

            System.out.println("\n=== VALIDATION SUMMARY ===");
            boolean overallPassed = true;

            for (ValidationReport report : reports) {
                System.out.println(report);
                if (!report.isValidationSuccess()) {
                    overallPassed = false;
                }
            }

            if (reports.isEmpty()) {
                System.out.println("No sample programs found to validate.");
                System.exit(1);
            }

            if (overallPassed) {
                System.out.println("SUCCESS: All pipeline components integrated and validated successfully!");
                System.exit(0);
            } else {
                System.err.println("FAILURE: One or more pipeline components failed validation checks.");
                System.exit(1);
            }

        } catch (IOException e) {
            System.err.println("Fatal validation system failure: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
