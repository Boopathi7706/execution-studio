package com.executionstudio.runtime.events;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.List;
import java.util.Map;

/**
 * Represents an object or array snapshot on the heap.
 *
 * <p>Used within the {@code heap} map of each trace event to describe the
 * actual state of objects referenced by variables.</p>
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = HeapObject.ObjectSnapshot.class, name = "object"),
    @JsonSubTypes.Type(value = HeapObject.ArraySnapshot.class, name = "array"),
})
public sealed interface HeapObject
    permits HeapObject.ObjectSnapshot, HeapObject.ArraySnapshot {

    /** Returns the type discriminator ("object" or "array"). */
    String type();

    /**
     * Snapshot of a regular Java object with its field values.
     *
     * @param className the fully qualified class name
     * @param fields    map of field name to field value
     */
    record ObjectSnapshot(
        String className,
        Map<String, HeapValue> fields
    ) implements HeapObject {
        @Override public String type() { return "object"; }
    }

    /**
     * Snapshot of a Java array with its element values.
     *
     * @param elementType the element type name (e.g., "int", "String")
     * @param length      the actual array length
     * @param elements    the captured element values (may be truncated)
     * @param truncated   true if the array was truncated due to capture limits
     */
    record ArraySnapshot(
        String elementType,
        int length,
        List<HeapValue> elements,
        boolean truncated
    ) implements HeapObject {
        @Override public String type() { return "array"; }
    }
}
