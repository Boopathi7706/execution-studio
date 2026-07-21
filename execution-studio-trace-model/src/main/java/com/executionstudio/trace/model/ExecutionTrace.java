package com.executionstudio.trace.model;

import java.util.List;

/**
 * The top-level execution trace — the complete output of the trace engine.
 *
 * <p>This is serialized directly to JSON as the final output file. It contains
 * the schema version, metadata, ordered events, and summary statistics.</p>
 *
 * @param schemaVersion version of the trace schema (e.g., "1.0.0")
 * @param metadata      execution metadata (environment, timings, termination)
 * @param events        ordered list of execution events
 * @param statistics    summary statistics for the trace
 */
public record ExecutionTrace(
    String schemaVersion,
    TraceMetadata metadata,
    List<TraceEvent> events,
    TraceStatistics statistics
) {
    /** Current schema version for this format. */
    public static final String CURRENT_SCHEMA_VERSION = "1.0.0";
}
