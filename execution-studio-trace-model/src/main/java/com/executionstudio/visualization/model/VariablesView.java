package com.executionstudio.visualization.model;

import java.util.List;

/**
 * Visual representation of variables scoped to active stack frames.
 */
public record VariablesView(
    List<VariableView> variables
) {}
