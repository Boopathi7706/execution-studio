package com.executionstudio.visualization.graph;

/**
 * Node in the visual reference graph.
 *
 * @param id    stable unique identifier (e.g. objectId)
 * @param label human-readable label (e.g. class name)
 * @param type  strongly-typed categorization of the node
 */
public record GraphNode(
    String id,
    String label,
    NodeType type
) {}
