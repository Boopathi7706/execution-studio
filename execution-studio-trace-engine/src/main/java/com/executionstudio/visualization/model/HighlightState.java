package com.executionstudio.visualization.model;

import java.util.List;

/**
 * Visual representation of execution focuses.
 *
 * @param currentLine       1-based source line number
 * @param currentMethod     name of the current executing method
 * @param currentStackFrame declaring class name of the current executing context
 * @param activeHighlights  list of highlight reasons per target
 */
public record HighlightState(
    int currentLine,
    String currentMethod,
    String currentStackFrame,
    List<Highlight> activeHighlights
) {}
