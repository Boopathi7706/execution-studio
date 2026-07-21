package com.executionstudio.visualization.model;

import java.util.Map;

/**
 * Visual representation of the heap area.
 *
 * @param objects map of synthetic ID to visual heap object views
 */
public record HeapView(
    Map<String, HeapObjectView> objects
) {}
