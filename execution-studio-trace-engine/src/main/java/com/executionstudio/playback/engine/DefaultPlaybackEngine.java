package com.executionstudio.playback.engine;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.playback.state.ExecutionStateBuilder;
import com.executionstudio.playback.timeline.Timeline;
import com.executionstudio.trace.model.ExecutionTrace;

/**
 * Default implementation of {@link PlaybackEngine}.
 *
 * <p>Coordinates navigation through a stateful {@link Timeline} and reconstructs
 * execution states using an {@link ExecutionStateBuilder}.</p>
 */
public class DefaultPlaybackEngine implements PlaybackEngine {

    private final ExecutionTrace trace;
    private final Timeline timeline;
    private final ExecutionStateBuilder stateBuilder;
    private ExecutionState currentState;

    public DefaultPlaybackEngine(
            ExecutionTrace trace,
            Timeline timeline,
            ExecutionStateBuilder stateBuilder) {
        if (trace == null) {
            throw new IllegalArgumentException("trace cannot be null");
        }
        if (timeline == null) {
            throw new IllegalArgumentException("timeline cannot be null");
        }
        if (stateBuilder == null) {
            throw new IllegalArgumentException("stateBuilder cannot be null");
        }
        this.trace = trace;
        this.timeline = timeline;
        this.stateBuilder = stateBuilder;
        // Initialize the first state
        this.currentState = stateBuilder.build(trace, timeline.currentIndex());
    }

    @Override
    public ExecutionState currentState() {
        return currentState;
    }

    @Override
    public ExecutionState next() {
        if (timeline.hasNext()) {
            timeline.seek(timeline.nextIndex());
            currentState = stateBuilder.build(trace, timeline.currentIndex());
        }
        return currentState;
    }

    @Override
    public ExecutionState previous() {
        if (timeline.hasPrevious()) {
            timeline.seek(timeline.previousIndex());
            currentState = stateBuilder.build(trace, timeline.currentIndex());
        }
        return currentState;
    }

    @Override
    public ExecutionState seek(int index) {
        timeline.seek(index);
        currentState = stateBuilder.build(trace, timeline.currentIndex());
        return currentState;
    }

    @Override
    public void restart() {
        timeline.reset();
        currentState = stateBuilder.build(trace, timeline.currentIndex());
    }

    @Override
    public int currentIndex() {
        return timeline.currentIndex();
    }

    @Override
    public boolean hasNext() {
        return timeline.hasNext();
    }

    @Override
    public boolean hasPrevious() {
        return timeline.hasPrevious();
    }
}
