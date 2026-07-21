package com.executionstudio.playback.state;

/**
 * Metadata representing the execution context at a point-in-time step.
 *
 * @param currentClass      active class name
 * @param currentMethod     active method name
 * @param currentEventIndex active event index (0-based index of the trace event)
 * @param exceptionType     fully qualified exception class name (null if normal execution)
 * @param exceptionMessage  exception detail message (null if normal execution or no message)
 */
public record ExecutionStateContext(
    String currentClass,
    String currentMethod,
    int currentEventIndex,
    String exceptionType,
    String exceptionMessage
) {}
