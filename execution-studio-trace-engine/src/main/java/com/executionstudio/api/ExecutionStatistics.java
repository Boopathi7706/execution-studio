package com.executionstudio.api;

/**
 * Representation of statistics compiled during the trace session.
 */
public record ExecutionStatistics(
    int totalLineEvents,
    int totalExceptionEvents,
    int maxStackDepth,
    int uniqueMethodsVisited,
    int uniqueLinesVisited
) {}
