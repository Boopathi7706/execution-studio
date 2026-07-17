package com.executionstudio.playback.session;

import com.executionstudio.playback.engine.PlaybackEngine;
import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.playback.timeline.Timeline;
import com.executionstudio.trace.model.ExecutionTrace;

/**
 * Root session managing the lifecycle of an active trace playback.
 *
 * <p>Isolates state parameters so that multiple trace sessions can be run in parallel.</p>
 */
public interface PlaybackSession {

    /** Returns the loaded trace DTO. */
    ExecutionTrace getTrace();

    /** Returns the index timeline navigator. */
    Timeline getTimeline();

    /** Returns the stateful playback engine. */
    PlaybackEngine getEngine();

    /** Returns the reconstructed execution state at the current pointer. */
    ExecutionState getCurrentState();

    /** Returns progress statistics for visual updates. */
    PlaybackMetadata getMetadata();
}
