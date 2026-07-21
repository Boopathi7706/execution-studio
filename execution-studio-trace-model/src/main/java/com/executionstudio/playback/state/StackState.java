package com.executionstudio.playback.state;

import java.util.List;

/**
 * Immutable representation of the call stack state.
 *
 * @param frames stack frames ordered from top (index 0 = current frame) to bottom
 */
public record StackState(
    List<FrameState> frames
) {}
