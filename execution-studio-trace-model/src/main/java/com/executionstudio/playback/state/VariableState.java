package com.executionstudio.playback.state;

import com.executionstudio.runtime.events.HeapValue;

/**
 * Immutable state of a local variable.
 *
 * @param name         name of the variable
 * @param declaredType Java type of the variable
 * @param value        the value captured
 */
public record VariableState(
    String name,
    String declaredType,
    HeapValue value
) {}
