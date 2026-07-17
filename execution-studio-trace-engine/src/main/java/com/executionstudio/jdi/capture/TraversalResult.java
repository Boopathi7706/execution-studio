package com.executionstudio.jdi.capture;

import com.executionstudio.runtime.events.HeapObject;
import com.executionstudio.runtime.events.HeapValue;

import java.util.Map;

/**
 * Result of an object graph traversal for a single value.
 *
 * @param value       the HeapValue representing the root value
 * @param heapObjects all objects discovered during traversal, keyed by synthetic objectId
 */
public record TraversalResult(
    HeapValue value,
    Map<String, HeapObject> heapObjects
) {}
