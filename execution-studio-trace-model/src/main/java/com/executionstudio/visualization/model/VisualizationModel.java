package com.executionstudio.visualization.model;

import com.executionstudio.visualization.graph.ReferenceGraph;

/**
 * Immutable root presentation model representing execution state mapped for displays.
 */
public record VisualizationModel(
    StackView stack,
    HeapView heap,
    VariablesView variables,
    ReferenceGraph graph,
    HighlightState highlights,
    ExecutionStatus status
) {}
