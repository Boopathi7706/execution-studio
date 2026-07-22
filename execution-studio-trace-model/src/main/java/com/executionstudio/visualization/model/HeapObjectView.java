package com.executionstudio.visualization.model;

import java.util.Map;

/**
 * Visual representation of an object or array snapshot on the heap.
 *
 * @param objectId        stable synthetic object ID
 * @param type            object type ("object" or "array")
 * @param classNameOrType fully qualified class name or array component type name
 * @param fieldsOrElements map of field name to value (for objects) or element index String to value (for arrays)
 */
public record HeapObjectView(
    String objectId,
    String type,
    String classNameOrType,
    Map<String, DisplayValue> fieldsOrElements
) {}
