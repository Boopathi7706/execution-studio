package com.executionstudio.cli;

import com.executionstudio.compiler.CompilationResult;
import com.executionstudio.compiler.Compiler;
import com.executionstudio.compiler.JavacCompiler;
import com.executionstudio.config.EngineConfig;
import com.executionstudio.context.ExecutionContext;
import com.executionstudio.context.SequenceGenerator;
import com.executionstudio.error.CompilationFailure;
import com.executionstudio.error.LaunchFailure;
import com.executionstudio.error.SerializationFailure;
import com.executionstudio.jdi.capture.*;
import com.executionstudio.launcher.DebugSession;
import com.executionstudio.launcher.JdiRuntimeLauncher;
import com.executionstudio.launcher.RuntimeLauncher;
import com.executionstudio.serializer.JacksonTraceSerializer;
import com.executionstudio.serializer.TraceSerializer;
import com.executionstudio.statistics.DefaultStatisticsCollector;
import com.executionstudio.statistics.StatisticsCollector;
import com.executionstudio.trace.builder.SnapshotTraceBuilder;
import com.executionstudio.trace.builder.TraceBuilder;
import com.executionstudio.trace.model.ExecutionTrace;
import com.executionstudio.trace.model.TraceMetadata;
import com.executionstudio.trace.model.TraceStatistics;
import com.executionstudio.watchdog.Watchdog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;

/**
 * Main entry point for the Execution Studio Trace Engine CLI.
 *
 * <p>Usage: {@code java -jar trace-engine.jar <source.java> <output-trace.json>}</p>
 *
 * <p>Orchestrates the full pipeline: compile → launch → capture → serialize.</p>
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
            EngineConfig config = parseArgs(args);
            TraceEngineApp app = new TraceEngineApp();
            app.run(config);
            System.exit(0);
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            log.error("Fatal error", e);
            System.exit(1);
        }
    }

    /**
     * Run the full trace engine pipeline.
     */
    public void run(EngineConfig config) throws Exception {
        Instant startTime = Instant.now();
        Path tempDir = null;

        try {
            // === Phase 1: Compile ===
            log.info("=== Phase 1: Compiling {} ===", config.getSourceFile().getFileName());
            Compiler compiler = new JavacCompiler();
            tempDir = Files.createTempDirectory("trace-engine-");
            CompilationResult compilationResult = compiler.compile(config.getSourceFile(), tempDir);

            if (!compilationResult.success()) {
                System.err.println("Compilation failed:");
                compilationResult.diagnostics().forEach(d -> System.err.println("  " + d));
                throw new CompilationFailure("Compilation failed", compilationResult.diagnostics());
            }

            System.out.println("Compiled successfully: " + compilationResult.mainClassName()
                + " (" + compilationResult.allClassNames().size() + " classes)");

            // === Phase 2: Initialize context ===
            log.info("=== Phase 2: Initializing execution context ===");
            ObjectRegistry objectRegistry = new DefaultObjectRegistry();
            TraceBuilder traceBuilder = new SnapshotTraceBuilder();
            StatisticsCollector statisticsCollector = new DefaultStatisticsCollector();
            Watchdog watchdog = new Watchdog();
            SequenceGenerator sequenceGenerator = new SequenceGenerator();

            ExecutionContext executionContext = new ExecutionContext(
                config, objectRegistry, traceBuilder, statisticsCollector,
                watchdog, sequenceGenerator, config.getSourceFile().getFileName().toString()
            );

            // Create capture components
            TraversalPolicy traversalPolicy = new TraversalPolicy(
                config.getObjectTraversalDepth(),
                config.getMaxObjectCount(),
                config.getArrayCaptureLimit()
            );
            HeapSnapshotFactory heapFactory = new HeapSnapshotFactory();
            ObjectGraphTraverser traverser = new ObjectGraphTraverser(
                objectRegistry, traversalPolicy, heapFactory, statisticsCollector);
            CaptureStrategy captureStrategy = new LineLevelCaptureStrategy(
                executionContext, traverser);

            // === Phase 3: Launch and capture ===
            log.info("=== Phase 3: Launching debuggee ===");
            RuntimeLauncher launcher = new JdiRuntimeLauncher();
            watchdog.start(config.getStepLimit(), config.getTimeoutSeconds());

            String terminationReason;
            try (DebugSession session = launcher.launch(
                    compilationResult.mainClassName(),
                    compilationResult.classDir(),
                    compilationResult.allClassNames())) {

                System.out.println("Debuggee launched. Capturing execution trace...");
                session.run(captureStrategy, watchdog);
                terminationReason = session.getTerminationReason();

            } finally {
                watchdog.stop();
            }

            // === Phase 4: Build trace ===
            log.info("=== Phase 4: Building trace ===");
            long durationMs = Duration.between(startTime, Instant.now()).toMillis();
            TraceStatistics statistics = statisticsCollector.build();

            TraceMetadata metadata = new TraceMetadata(
                Instant.now(),
                config.getToolVersion(),
                System.getProperty("java.version"),
                config.getSourceFile().getFileName().toString(),
                compilationResult.mainClassName(),
                durationMs,
                terminationReason,
                traceBuilder.eventCount(),
                objectRegistry.totalObjects(),
                computeTotalFrames(traceBuilder)
            );

            ExecutionTrace trace = traceBuilder.build(metadata, statistics);

            // === Phase 5: Serialize ===
            log.info("=== Phase 5: Serializing trace ===");
            TraceSerializer serializer = new JacksonTraceSerializer();
            serializer.serialize(trace, config.getOutputFile());

            System.out.println();
            System.out.println("Trace captured successfully!");
            System.out.println("  Events: " + trace.events().size());
            System.out.println("  Objects: " + objectRegistry.totalObjects());
            System.out.println("  Termination: " + terminationReason);
            System.out.println("  Output: " + config.getOutputFile().toAbsolutePath());

        } finally {
            // Clean up temp directory
            if (tempDir != null) {
                cleanupTempDir(tempDir);
            }
        }
    }

    private static EngineConfig parseArgs(String[] args) {
        EngineConfig.Builder builder = EngineConfig.builder();

        // Required positional args
        builder.sourceFile(Path.of(args[0]).toAbsolutePath());
        builder.outputFile(Path.of(args[1]).toAbsolutePath());

        // Optional named args
        for (int i = 2; i < args.length; i++) {
            switch (args[i]) {
                case "--step-limit":
                    builder.stepLimit(Integer.parseInt(args[++i]));
                    break;
                case "--timeout":
                    builder.timeoutSeconds(Integer.parseInt(args[++i]));
                    break;
                case "--log-level":
                    builder.logLevel(args[++i]);
                    break;
                default:
                    System.err.println("Unknown option: " + args[i]);
                    System.exit(1);
            }
        }

        return builder.build();
    }

    private int computeTotalFrames(TraceBuilder builder) {
        // Total frames is tracked via statistics; use event count as rough proxy
        return builder.eventCount();
    }

    private void cleanupTempDir(Path tempDir) {
        try {
            Files.walk(tempDir)
                .sorted(java.util.Comparator.reverseOrder())
                .forEach(p -> {
                    try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                });
        } catch (IOException e) {
            log.warn("Failed to clean up temp directory: {}", tempDir);
        }
    }
}
