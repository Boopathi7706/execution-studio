package com.executionstudio.visualization.model;

import java.util.List;

/**
 * Visual representation of the call stack.
 *
 * @param frames stack frame views ordered top-to-bottom
 */
public record StackView(
    List<FrameView> frames
) {}
