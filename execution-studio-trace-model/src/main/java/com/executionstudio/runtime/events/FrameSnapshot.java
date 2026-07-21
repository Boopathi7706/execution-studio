package com.executionstudio.runtime.events;

import java.util.List;

/**
 * Snapshot of a single stack frame at a point in execution.
 *
 * @param className  the declaring class name
 * @param methodName the method name
 * @param lineNumber the source line number
 * @param locals     all visible local variables in this frame
 */
public record FrameSnapshot(
    String className,
    String methodName,
    int lineNumber,
    List<VariableSnapshot> locals
) {}
