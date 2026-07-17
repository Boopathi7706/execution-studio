package com.executionstudio.playback.loader;

import com.executionstudio.playback.exception.PlaybackException;
import com.executionstudio.trace.model.ExecutionTrace;

import java.nio.file.Path;

/**
 * Loads and validates an execution trace file.
 */
public interface TraceLoader {

    /**
     * Load an execution trace from a JSON file.
     *
     * @param traceFile path to the trace JSON file
     * @return the deserialized, validated execution trace DTO
     * @throws PlaybackException if the file is unreadable, invalid JSON, or fails semantic validations
     */
    ExecutionTrace load(Path traceFile) throws PlaybackException;
}
