package com.executionstudio.playback.session;

import com.executionstudio.playback.engine.DefaultPlaybackEngine;
import com.executionstudio.playback.engine.PlaybackEngine;
import com.executionstudio.playback.state.DefaultExecutionStateBuilder;
import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.playback.timeline.DefaultTimeline;
import com.executionstudio.playback.timeline.Timeline;
import com.executionstudio.trace.model.ExecutionTrace;

/**
 * Default implementation of {@link PlaybackSession}.
 */
public class DefaultPlaybackSession implements PlaybackSession {

    private final ExecutionTrace trace;
    private final Timeline timeline;
    private final PlaybackEngine engine;

    public DefaultPlaybackSession(ExecutionTrace trace) {
        if (trace == null) {
            throw new IllegalArgumentException("ExecutionTrace cannot be null");
        }
        this.trace = trace;
        this.timeline = new DefaultTimeline(trace.events().size());
        this.engine = new DefaultPlaybackEngine(
            trace,
            timeline,
            new DefaultExecutionStateBuilder()
        );
    }

    @Override
    public ExecutionTrace getTrace() {
        return trace;
    }

    @Override
    public Timeline getTimeline() {
        return timeline;
    }

    @Override
    public PlaybackEngine getEngine() {
        return engine;
    }

    @Override
    public ExecutionState getCurrentState() {
        return engine.currentState();
    }

    @Override
    public PlaybackMetadata getMetadata() {
        int total = trace.events().size();
        if (total == 0) {
            return new PlaybackMetadata(0, 0, 0.0);
        }
        int current = timeline.currentIndex();
        int step = current + 1;
        double progress = (double) current / (double) (total - 1) * 100.0;
        // Clamp to [0.0, 100.0]
        progress = Math.max(0.0, Math.min(100.0, progress));

        return new PlaybackMetadata(step, total, progress);
    }
}
