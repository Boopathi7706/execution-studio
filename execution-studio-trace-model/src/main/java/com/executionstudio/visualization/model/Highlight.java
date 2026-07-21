package com.executionstudio.visualization.model;

/**
 * Declares a single visual highlight focus.
 *
 * @param targetId ID of the focused target (e.g. variable name, node ID)
 * @param reason   semantic reason for the focus
 */
public record Highlight(
    String targetId,
    HighlightReason reason
) {}
