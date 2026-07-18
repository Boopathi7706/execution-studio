package com.executionstudio.visualization.graph;

import java.util.List;

/**
 * Generic node/edge graph representation of visual memory references.
 *
 * <p>Can represent cyclical objects, lists, trees, and custom diagrams.</p>
 */
public record ReferenceGraph(
    List<GraphNode> nodes,
    List<GraphEdge> edges
) {}
