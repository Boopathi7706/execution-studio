package com.executionstudio.jdi.capture;

import java.util.HashSet;
import java.util.Set;

/**
 * Policy governing object graph traversal during capture.
 *
 * <p>Enforces depth limits, cycle detection via visited set, object count limits,
 * and array element limits. Reset between steps so the same object can be
 * fully captured in different events.</p>
 */
public class TraversalPolicy {

    private final int maxDepth;
    private final int maxObjects;
    private final int maxArrayElements;
    private final Set<Long> visitedIds = new HashSet<>();
    private int objectCount = 0;

    public TraversalPolicy(int maxDepth, int maxObjects, int maxArrayElements) {
        this.maxDepth = maxDepth;
        this.maxObjects = maxObjects;
        this.maxArrayElements = maxArrayElements;
    }

    /**
     * Check whether this object should be traversed (its fields/elements read).
     *
     * @param jdiUniqueId  the JDI object's unique ID
     * @param currentDepth the current traversal depth (0 = top level)
     * @return true if the object should be fully traversed; false if it should
     *         be emitted as a reference only
     */
    public boolean shouldTraverse(long jdiUniqueId, int currentDepth) {
        if (currentDepth >= maxDepth) {
            return false;
        }
        if (visitedIds.contains(jdiUniqueId)) {
            return false; // Cycle detection
        }
        if (objectCount >= maxObjects) {
            return false;
        }
        return true;
    }

    /**
     * Mark an object as visited during this step's traversal.
     */
    public void markVisited(long jdiUniqueId) {
        visitedIds.add(jdiUniqueId);
        objectCount++;
    }

    /**
     * Returns the maximum number of array elements to capture.
     */
    public int getMaxArrayElements() {
        return maxArrayElements;
    }

    /**
     * Returns the maximum traversal depth.
     */
    public int getMaxDepth() {
        return maxDepth;
    }

    /**
     * Reset the visited set and object count for the next step.
     */
    public void reset() {
        visitedIds.clear();
        objectCount = 0;
    }
}
