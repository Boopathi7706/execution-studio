package com.executionstudio.playback.state;

import com.executionstudio.trace.model.ExecutionTrace;

/**
 * Reconstructs the program's execution state from a trace and a specific index.
 */
public interface ExecutionStateBuilder {

    /**
     * Build the immutable runtime execution state for the target event index.
     *
     * @param trace      the loaded execution trace
     * @param eventIndex the event index to build state for
     * @return the reconstructed execution state
     */
    ExecutionState build(ExecutionTrace trace, int eventIndex);
}
