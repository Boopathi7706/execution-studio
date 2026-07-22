package com.executionstudio.api;

import com.executionstudio.playback.timeline.Timeline;
import java.nio.file.Path;
import java.util.Objects;

/**
 * Holds the complete execution result of a trace run.
 */
public record TraceResult(
    Timeline timeline,
    ExecutionStatistics statistics,
    Path traceFile
) {
    public TraceResult {
        Objects.requireNonNull(timeline, "timeline must not be null");
        Objects.requireNonNull(statistics, "statistics must not be null");
        Objects.requireNonNull(traceFile, "traceFile must not be null");
    }
}
