package com.executionstudio.trace.model;

import java.time.Instant;

/**
 * Metadata about the trace execution environment and results.
 *
 * @param generatedAt        timestamp when the trace was generated
 * @param toolVersion        version of the trace engine tool
 * @param javaVersion        JDK version used for compilation and execution
 * @param sourceFile         name of the source file traced
 * @param mainClass          the main class that was executed
 * @param executionDurationMs total execution duration in milliseconds
 * @param terminationReason  why execution ended: "normal_exit", "uncaught_exception",
 *                           "step_cap_exceeded", or "timeout"
 * @param totalEvents        total number of events in the trace
 * @param totalObjects       total unique objects seen on the heap
 * @param totalFrames        total stack frames captured across all events
 */
public record TraceMetadata(
    Instant generatedAt,
    String toolVersion,
    String javaVersion,
    String sourceFile,
    String mainClass,
    long executionDurationMs,
    String terminationReason,
    int totalEvents,
    int totalObjects,
    int totalFrames
) {}
