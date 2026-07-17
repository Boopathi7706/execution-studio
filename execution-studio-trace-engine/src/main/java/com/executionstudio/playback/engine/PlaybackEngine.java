package com.executionstudio.playback.engine;

import com.executionstudio.playback.state.ExecutionState;

/**
 * Handles execution state navigation over the timeline.
 */
public interface PlaybackEngine {

    /** Returns the current execution state. */
    ExecutionState currentState();

    /** Steps forward and returns the next execution state. */
    ExecutionState next();

    /** Steps backward and returns the previous execution state. */
    ExecutionState previous();

    /** Seeks to the target index and returns its execution state. */
    ExecutionState seek(int index);

    /** Resets the timeline to the start index. */
    void restart();

    /** Returns the current active index. */
    int currentIndex();

    /** Returns true if there are future steps. */
    boolean hasNext();

    /** Returns true if there are past steps. */
    boolean hasPrevious();
}
