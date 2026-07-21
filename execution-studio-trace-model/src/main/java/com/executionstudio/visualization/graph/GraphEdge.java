package com.executionstudio.visualization.graph;

/**
 * Directed edge in the visual reference graph.
 *
 * @param source           originating node ID
 * @param target           destination node ID
 * @param relationshipType strongly-typed relationship type
 */
public record GraphEdge(
    String source,
    String target,
    EdgeType relationshipType
) {}
