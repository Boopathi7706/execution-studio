package com.executionstudio.playback.state;

/**
 * Immutable domain model representing the complete runtime state at a single step.
 *
 * @param position Current coordinates in source file
 * @param stack    State of active stack frames
 * @param heap     Heap snapshot visible at this event
 * @param context  Details of the executing thread/method and exception statuses
 */
public record ExecutionState(
    CurrentPosition position,
    StackState stack,
    HeapState heap,
    ExecutionStateContext context
) {}
