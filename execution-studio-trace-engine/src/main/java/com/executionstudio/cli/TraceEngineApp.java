package com.executionstudio.cli;

import com.executionstudio.api.TraceEngine;
import com.executionstudio.api.TraceRequest;
import com.executionstudio.api.TraceResult;
import com.executionstudio.config.EngineConfig;
import com.executionstudio.service.DefaultTraceEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * Main entry point for the Execution Studio Trace Engine CLI.
 *
 * <p>Usage: {@code java -jar trace-engine.jar <source.java> <output-trace.json>}</p>
 *
 * <p>Delegates orchestration to the reusable TraceEngine public API.</p>
 */
public class TraceEngineApp {

    private static final Logger log = LoggerFactory.getLogger(TraceEngineApp.class);

    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Usage: java -jar trace-engine.jar <source.java> <output-trace.json>");
            System.err.println();
            System.err.println("Options:");
            System.err.println("  --step-limit <N>     Maximum execution steps (default: 50000)");
            System.err.println("  --timeout <seconds>  Maximum execution time (default: 10)");
            System.exit(1);
            return;
        }

        try {
            Path sourceFile = Path.of(args[0]).toAbsolutePath();
            Path targetOutputFile = Path.of(args[1]).toAbsolutePath();
            String className = sourceFile.getFileName().toString().replace(".java", "");
            Path outputDirectory = targetOutputFile.getParent();
            if (outputDirectory == null) {
                outputDirectory = Path.of(".");
            }

            TraceRequest.Builder requestBuilder = TraceRequest.builder()
                .sourceFile(sourceFile)
                .className(className)
                .outputDirectory(outputDirectory);

            // Parse optional arguments
            for (int i = 2; i < args.length; i++) {
                switch (args[i]) {
                    case "--step-limit":
                        requestBuilder.stepLimit(Integer.parseInt(args[++i]));
                        break;
                    case "--timeout":
                        requestBuilder.timeoutSeconds(Integer.parseInt(args[++i]));
                        break;
                    case "--log-level":
                        // Ignore or set log level if needed (standard behavior)
                        i++;
                        break;
                    default:
                        System.err.println("Unknown option: " + args[i]);
                        System.exit(1);
                }
            }

            TraceRequest request = requestBuilder.build();
            TraceEngine engine = new DefaultTraceEngine();
            TraceResult result = engine.execute(request);

            // Move the generated trace file to the exact target path specified by the CLI arg
            Files.move(result.traceFile(), targetOutputFile, StandardCopyOption.REPLACE_EXISTING);

            System.out.println();
            System.out.println("Trace captured successfully!");
            System.out.println("  Events: " + (result.timeline().lastIndex() + 1));
            System.out.println("  Output: " + targetOutputFile.toAbsolutePath());

            System.exit(0);
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            log.error("Fatal error", e);
            System.exit(1);
        }
    }

    /**
     * Run the full trace engine pipeline.
     * Preserved for backward compatibility with integration test suites.
     */
    public void run(EngineConfig config) throws Exception {
        Path sourceFile = config.getSourceFile();
        String className = sourceFile.getFileName().toString().replace(".java", "");
        Path outputDirectory = config.getOutputFile().getParent();
        if (outputDirectory == null) {
            outputDirectory = Path.of(".");
        }

        TraceRequest request = TraceRequest.builder()
            .sourceFile(sourceFile)
            .className(className)
            .outputDirectory(outputDirectory)
            .stepLimit(config.getStepLimit())
            .timeoutSeconds(config.getTimeoutSeconds())
            .build();

        TraceEngine engine = new DefaultTraceEngine();
        TraceResult result = engine.execute(request);

        // Move the generated trace file to the exact target path specified by the config
        Files.move(result.traceFile(), config.getOutputFile(), StandardCopyOption.REPLACE_EXISTING);
    }
}
