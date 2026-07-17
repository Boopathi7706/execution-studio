package com.executionstudio.context;

import com.executionstudio.config.EngineConfig;
import com.executionstudio.jdi.capture.ObjectRegistry;
import com.executionstudio.statistics.StatisticsCollector;
import com.executionstudio.trace.builder.TraceBuilder;
import com.executionstudio.watchdog.Watchdog;

import java.time.Instant;

/**
 * Shared runtime context for a single trace execution.
 *
 * <p><b>Responsibility:</b> Provide a single container for all shared runtime
 * dependencies, reducing parameter passing clutter across components.</p>
 *
 * <p><b>Preconditions:</b> All constructor parameters must be non-null and initialized.</p>
 * <p><b>Postconditions:</b> All accessors return the same instances throughout
 * the execution lifetime.</p>
 * <p><b>Thread Safety:</b> The context itself is immutable after construction.
 * Thread safety of individual components is documented on each component.</p>
 * <p><b>Ownership:</b> The CLI layer creates and owns the context. Components
 * are shared references, not owned by the context.</p>
 * <p><b>Failure Conditions:</b> None — this is a passive container.</p>
 */
public class ExecutionContext {

    private final EngineConfig config;
    private final ObjectRegistry objectRegistry;
    private final TraceBuilder traceBuilder;
    private final StatisticsCollector statisticsCollector;
    private final Watchdog watchdog;
    private final SequenceGenerator sequenceGenerator;
    private final String sourceFileName;
    private final Instant startTime;

    public ExecutionContext(
            EngineConfig config,
            ObjectRegistry objectRegistry,
            TraceBuilder traceBuilder,
            StatisticsCollector statisticsCollector,
            Watchdog watchdog,
            SequenceGenerator sequenceGenerator,
            String sourceFileName) {
        this.config = config;
        this.objectRegistry = objectRegistry;
        this.traceBuilder = traceBuilder;
        this.statisticsCollector = statisticsCollector;
        this.watchdog = watchdog;
        this.sequenceGenerator = sequenceGenerator;
        this.sourceFileName = sourceFileName;
        this.startTime = Instant.now();
    }

    public EngineConfig getConfig() {
        return config;
    }

    public ObjectRegistry getObjectRegistry() {
        return objectRegistry;
    }

    public TraceBuilder getTraceBuilder() {
        return traceBuilder;
    }

    public StatisticsCollector getStatisticsCollector() {
        return statisticsCollector;
    }

    public Watchdog getWatchdog() {
        return watchdog;
    }

    public SequenceGenerator getSequenceGenerator() {
        return sequenceGenerator;
    }

    public String getSourceFileName() {
        return sourceFileName;
    }

    public Instant getStartTime() {
        return startTime;
    }
}
