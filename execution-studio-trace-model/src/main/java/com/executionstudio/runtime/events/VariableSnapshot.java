package com.executionstudio.runtime.events;

/**
 * Snapshot of a single local variable's state.
 *
 * @param name         the variable name as declared in source
 * @param declaredType the declared type (e.g., "int", "String[]", "Point")
 * @param value        the variable's current value
 */
public record VariableSnapshot(
    String name,
    String declaredType,
    HeapValue value
) {}
