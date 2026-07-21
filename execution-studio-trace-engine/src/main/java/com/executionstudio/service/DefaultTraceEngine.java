package com.executionstudio.service;

import com.executionstudio.api.ExecutionStatistics;
import com.executionstudio.api.TraceEngine;
import com.executionstudio.api.TraceEngineException;
import com.executionstudio.api.TraceRequest;
import com.executionstudio.api.TraceResult;
import com.executionstudio.compiler.CompilationResult;
import com.executionstudio.compiler.Compiler;
import com.executionstudio.compiler.JavacCompiler;
import com.executionstudio.config.EngineConfig;
import com.executionstudio.context.ExecutionContext;
import com.executionstudio.context.SequenceGenerator;
import com.executionstudio.jdi.capture.CaptureStrategy;
import com.executionstudio.jdi.capture.DefaultObjectRegistry;
import com.executionstudio.jdi.capture.HeapSnapshotFactory;
import com.executionstudio.jdi.capture.LineLevelCaptureStrategy;
import com.executionstudio.jdi.capture.ObjectGraphTraverser;
import com.executionstudio.jdi.capture.ObjectRegistry;
import com.executionstudio.jdi.capture.TraversalPolicy;
import com.executionstudio.launcher.DebugSession;
import com.executionstudio.launcher.JdiRuntimeLauncher;
import com.executionstudio.launcher.RuntimeLauncher;
import com.executionstudio.playback.timeline.DefaultTimeline;
import com.executionstudio.playback.timeline.Timeline;
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
 * Default implementation of {@link TraceEngine} that coordinates the full trace execution pipeline.
 */
public class DefaultTraceEngine implements TraceEngine {

    private static final Logger log = LoggerFactory.getLogger(DefaultTraceEngine.class);

    private final Compiler compiler;
    private final RuntimeLauncher launcher;
    private final TraceSerializer serializer;

    public DefaultTraceEngine() {
        this.compiler = new JavacCompiler();
        this.launcher = new JdiRuntimeLauncher();
        this.serializer = new JacksonTraceSerializer();
    }

    // Allows dependency injection for testing if needed
    public DefaultTraceEngine(Compiler compiler, RuntimeLauncher launcher, TraceSerializer serializer) {
        this.compiler = compiler;
        this.launcher = launcher;
        this.serializer = serializer;
    }

    @Override
    public TraceResult execute(TraceRequest request) throws TraceEngineException {
        Instant startTime = Instant.now();
        Path tempDir = null;

        try {
            // Create output directory if it doesn't exist
            Files.createDirectories(request.getOutputDirectory());
            Path outputFile = request.getOutputDirectory().resolve(request.getClassName() + "-trace.json");

            // Build config with sensible defaults
            EngineConfig.Builder configBuilder = EngineConfig.builder()
                .sourceFile(request.getSourceFile())
                .outputFile(outputFile);

            if (request.getStepLimit() != null) {
                configBuilder.stepLimit(request.getStepLimit());
            }
            if (request.getTimeoutSeconds() != null) {
                configBuilder.timeoutSeconds(request.getTimeoutSeconds());
            }

            EngineConfig config = configBuilder.build();

            // === Phase 1: Compile ===
            log.info("Compiling source: {}", config.getSourceFile().getFileName());
            tempDir = Files.createTempDirectory("trace-engine-");
            CompilationResult compilationResult = compiler.compile(config.getSourceFile(), tempDir);

            if (!compilationResult.success()) {
                throw new TraceEngineException("Compilation failed for " + request.getSourceFile().getFileName());
            }

            // === Phase 2: Initialize Context ===
            log.info("Initializing execution context for class: {}", compilationResult.mainClassName());
            ObjectRegistry objectRegistry = new DefaultObjectRegistry();
            TraceBuilder traceBuilder = new SnapshotTraceBuilder();
            StatisticsCollector statisticsCollector = new DefaultStatisticsCollector();
            Watchdog watchdog = new Watchdog();
            SequenceGenerator sequenceGenerator = new SequenceGenerator();

            ExecutionContext executionContext = new ExecutionContext(
                config, objectRegistry, traceBuilder, statisticsCollector,
                watchdog, sequenceGenerator, config.getSourceFile().getFileName().toString()
            );

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

            // === Phase 3: Launch and capture JDI events ===
            log.info("Launching JVM and capturing trace events");
            watchdog.start(config.getStepLimit(), config.getTimeoutSeconds());

            String terminationReason;
            try (DebugSession session = launcher.launch(
                    compilationResult.mainClassName(),
                    compilationResult.classDir(),
                    compilationResult.allClassNames())) {

                session.run(captureStrategy, watchdog);
                terminationReason = session.getTerminationReason();

            } finally {
                watchdog.stop();
            }

            // === Phase 4: Build Timeline / Trace ===
            log.info("Execution complete. Building trace results");
            long durationMs = Duration.between(startTime, Instant.now()).toMillis();
            TraceStatistics traceStats = statisticsCollector.build();

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
                traceBuilder.eventCount() // compute total frames rough proxy
            );

            ExecutionTrace trace = traceBuilder.build(metadata, traceStats);

            // === Phase 5: Serialize Trace ===
            log.info("Serializing execution trace to: {}", config.getOutputFile());
            serializer.serialize(trace, config.getOutputFile());

            // === Phase 6: Build Public Result DTOs ===
            Timeline timeline = new DefaultTimeline(trace.events().size());

            int totalLineEvents = (int) trace.events().stream()
                .filter(e -> "line".equals(e.type()))
                .count();

            int totalExceptionEvents = (int) trace.events().stream()
                .filter(e -> "exception".equals(e.type()))
                .count();

            int maxStackDepth = traceStats.maxCallStackDepth();
            int uniqueMethodsVisited = traceStats.uniqueMethodsExecuted();

            int uniqueLinesVisited = (int) trace.events().stream()
                .map(e -> e.className() + ":" + e.lineNumber())
                .distinct()
                .count();

            ExecutionStatistics publicStats = new ExecutionStatistics(
                totalLineEvents,
                totalExceptionEvents,
                maxStackDepth,
                uniqueMethodsVisited,
                uniqueLinesVisited
            );

            return new TraceResult(timeline, publicStats, config.getOutputFile());

        } catch (Exception e) {
            log.error("Trace execution pipeline failed", e);
            throw new TraceEngineException("Trace execution failed: " + e.getMessage(), e);
        } finally {
            if (tempDir != null) {
                cleanupTempDir(tempDir);
            }
        }
    }

    private void cleanupTempDir(Path tempDir) {
        try {
            Files.walk(tempDir)
                .sorted(java.util.Comparator.reverseOrder())
                .forEach(p -> {
                    try {
                        Files.deleteIfExists(p);
                    } catch (IOException ignored) {
                    }
                });
        } catch (IOException e) {
            log.warn("Failed to clean up temp directory: {}", tempDir);
        }
    }
}
