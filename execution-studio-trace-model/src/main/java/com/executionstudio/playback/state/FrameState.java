package com.executionstudio.playback.state;

import java.util.List;

/**
 * Immutable state of a single stack frame.
 *
 * @param className  name of the declaring class
 * @param methodName name of the method
 * @param lineNumber 1-based source line number
 * @param locals     variables visible in this frame
 */
public record FrameState(
    String className,
    String methodName,
    int lineNumber,
    List<VariableState> locals
) {}
