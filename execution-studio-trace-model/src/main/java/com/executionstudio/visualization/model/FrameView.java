package com.executionstudio.visualization.model;

import java.util.List;

/**
 * Visual representation of an active stack frame.
 *
 * @param className  name of the declaring class
 * @param methodName name of the method
 * @param lineNumber 1-based source line number
 * @param locals     variables visible in this frame
 * @param isActive   true if this frame is at the top of the call stack (executing context)
 */
public record FrameView(
    String className,
    String methodName,
    int lineNumber,
    List<VariableView> locals,
    boolean isActive
) {}
