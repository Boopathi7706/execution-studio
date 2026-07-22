package com.executionstudio.visualization.model;

/**
 * Visual representation of an active local variable.
 *
 * @param name         declared name
 * @param declaredType declared type
 * @param value        mapped visual value representation
 * @param scope        active frame context (method/block name)
 * @param changed      true if the value has changed since the previous execution step
 */
public record VariableView(
    String name,
    String declaredType,
    DisplayValue value,
    String scope,
    boolean changed
) {}
