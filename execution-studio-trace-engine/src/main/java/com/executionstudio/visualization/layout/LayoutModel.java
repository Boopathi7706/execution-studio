package com.executionstudio.visualization.layout;

import java.util.Map;

/**
 * Immutable mapping of visual element target IDs to Point2D coordinates.
 */
public record LayoutModel(
    Map<String, Point2D> positions
) {}
