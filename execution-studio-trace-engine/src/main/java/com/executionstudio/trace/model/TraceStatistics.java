package com.executionstudio.trace.model;

/**
 * Summary statistics for the execution trace.
 *
 * @param maxCallStackDepth     deepest call stack observed
 * @param uniqueMethodsExecuted number of distinct methods entered
 * @param loopIterationsDetected approximate number of loop iterations (same line re-visited)
 * @param objectsCreated        total objects allocated
 * @param arraysCreated         total arrays allocated
 */
public record TraceStatistics(
    int maxCallStackDepth,
    int uniqueMethodsExecuted,
    int loopIterationsDetected,
    int objectsCreated,
    int arraysCreated
) {}
