package com.executionstudio.jdi.capture;

/**
 * Maps JDI object unique IDs to stable synthetic trace IDs.
 *
 * <p><b>Responsibility:</b> Maintain a 1:1 mapping from JDI
 * {@code ObjectReference.uniqueID()} values to human-readable "obj_N" strings,
 * assigning new IDs monotonically on first encounter.</p>
 *
 * <p><b>Preconditions:</b> jdiUniqueId is a valid, positive long from
 * {@code ObjectReference.uniqueID()}.</p>
 * <p><b>Postconditions:</b></p>
 * <ul>
 *   <li>The same jdiUniqueId always returns the same objectId string.</li>
 *   <li>IDs are assigned in monotonically increasing order ("obj_1", "obj_2", ...).</li>
 * </ul>
 * <p><b>Thread Safety:</b> Not thread-safe. Used from the JDI event loop thread only.</p>
 * <p><b>Ownership:</b> The registry owns the mapping for the lifetime of the trace execution.</p>
 * <p><b>Failure Conditions:</b> None — this is a pure in-memory mapping.</p>
 */
public interface ObjectRegistry {

    /**
     * Get or assign a synthetic object ID for the given JDI unique ID.
     *
     * @param jdiUniqueId the JDI ObjectReference.uniqueID() value
     * @return a stable synthetic ID like "obj_1", "obj_2", etc.
     */
    String getOrAssignId(long jdiUniqueId);

    /**
     * Check whether an object ID has already been assigned for this JDI unique ID.
     */
    boolean isKnown(long jdiUniqueId);

    /**
     * Returns the total number of unique objects registered.
     */
    int totalObjects();
}
