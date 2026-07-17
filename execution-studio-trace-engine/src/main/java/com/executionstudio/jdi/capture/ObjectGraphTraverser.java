package com.executionstudio.jdi.capture;

import com.executionstudio.runtime.events.HeapObject;
import com.executionstudio.runtime.events.HeapValue;
import com.executionstudio.statistics.StatisticsCollector;
import com.sun.jdi.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Traverses JDI object graphs and produces heap snapshot DTOs.
 *
 * <p>Coordinates between {@link TraversalPolicy} for rules (depth limits, cycle detection)
 * and {@link HeapSnapshotFactory} for DTO creation. All JDI type translation happens here.</p>
 *
 * <p>Call {@link #reset()} before each step to clear the visited set.</p>
 */
public class ObjectGraphTraverser {

    private static final Logger log = LoggerFactory.getLogger(ObjectGraphTraverser.class);

    private final ObjectRegistry registry;
    private final TraversalPolicy policy;
    private final HeapSnapshotFactory factory;
    private final StatisticsCollector stats;

    public ObjectGraphTraverser(ObjectRegistry registry, TraversalPolicy policy,
                                 HeapSnapshotFactory factory, StatisticsCollector stats) {
        this.registry = registry;
        this.policy = policy;
        this.factory = factory;
        this.stats = stats;
    }

    public ObjectGraphTraverser(ObjectRegistry registry, TraversalPolicy policy,
                                 HeapSnapshotFactory factory) {
        this(registry, policy, factory, null);
    }

    /**
     * Reset the traversal state for a new step.
     */
    public void reset() {
        policy.reset();
    }

    /**
     * Traverse a JDI Value and produce a HeapValue plus any heap objects discovered.
     *
     * @param jdiValue the JDI value to traverse (may be null)
     * @param depth    the current traversal depth
     * @param heapCollector mutable map to collect heap objects into
     * @return the HeapValue representation of this value
     */
    public HeapValue traverse(Value jdiValue, int depth, Map<String, HeapObject> heapCollector) {
        if (jdiValue == null) {
            return factory.createNullValue();
        }

        // Primitives
        if (jdiValue instanceof IntegerValue v) {
            return factory.createIntValue(v.value());
        }
        if (jdiValue instanceof LongValue v) {
            return factory.createLongValue(v.value());
        }
        if (jdiValue instanceof FloatValue v) {
            return factory.createFloatValue(v.value());
        }
        if (jdiValue instanceof DoubleValue v) {
            return factory.createDoubleValue(v.value());
        }
        if (jdiValue instanceof BooleanValue v) {
            return factory.createBooleanValue(v.value());
        }
        if (jdiValue instanceof CharValue v) {
            return factory.createCharValue(v.value());
        }
        if (jdiValue instanceof ShortValue v) {
            return factory.createIntValue(v.value());
        }
        if (jdiValue instanceof ByteValue v) {
            return factory.createIntValue(v.value());
        }

        // Void (shouldn't appear as a variable value, but handle gracefully)
        if (jdiValue instanceof VoidValue) {
            return factory.createNullValue();
        }

        // String reference — special-cased for human-readable output
        if (jdiValue instanceof StringReference strRef) {
            long jdiId = strRef.uniqueID();
            boolean isNew = !registry.isKnown(jdiId);
            String objectId = registry.getOrAssignId(jdiId);
            if (isNew && stats != null) {
                stats.recordObjectCreated();
            }
            return factory.createStringValue(strRef.value(), objectId);
        }

        // Array reference
        if (jdiValue instanceof ArrayReference arrayRef) {
            return traverseArray(arrayRef, depth, heapCollector);
        }

        // Object reference
        if (jdiValue instanceof ObjectReference objRef) {
            return traverseObject(objRef, depth, heapCollector);
        }

        // Fallback — unknown value type
        log.warn("Unknown JDI value type: {}", jdiValue.getClass().getName());
        return factory.createNullValue();
    }

    private HeapValue traverseArray(ArrayReference arrayRef, int depth,
                                     Map<String, HeapObject> heapCollector) {
        long jdiId = arrayRef.uniqueID();
        boolean isNew = !registry.isKnown(jdiId);
        String objectId = registry.getOrAssignId(jdiId);
        if (isNew && stats != null) {
            stats.recordArrayCreated();
        }

        if (!policy.shouldTraverse(jdiId, depth)) {
            return factory.createArrayRef(objectId);
        }

        policy.markVisited(jdiId);

        try {
            int length = arrayRef.length();
            String elementType = getArrayElementTypeName(arrayRef);
            int captureLimit = policy.getMaxArrayElements();
            boolean truncated = length > captureLimit;
            int captureCount = truncated ? captureLimit : length;

            List<HeapValue> elements = new ArrayList<>(captureCount);
            if (captureCount > 0) {
                List<Value> jdiElements = arrayRef.getValues(0, captureCount);
                for (Value elem : jdiElements) {
                    elements.add(traverse(elem, depth + 1, heapCollector));
                }
            }

            heapCollector.put(objectId,
                factory.createArraySnapshot(elementType, length, elements, truncated));
            return factory.createArrayRef(objectId);

        } catch (Exception e) {
            log.warn("Failed to traverse array obj {}: {}", objectId, e.getMessage());
            return factory.createArrayRef(objectId);
        }
    }

    private HeapValue traverseObject(ObjectReference objRef, int depth,
                                      Map<String, HeapObject> heapCollector) {
        long jdiId = objRef.uniqueID();
        boolean isNew = !registry.isKnown(jdiId);
        String objectId = registry.getOrAssignId(jdiId);
        if (isNew && stats != null) {
            stats.recordObjectCreated();
        }

        if (!policy.shouldTraverse(jdiId, depth)) {
            return factory.createObjectRef(objectId);
        }

        policy.markVisited(jdiId);

        try {
            ReferenceType refType = objRef.referenceType();
            String className = refType.name();

            // Get all instance fields (not static)
            List<Field> fields = refType.allFields().stream()
                .filter(f -> !f.isStatic())
                .toList();

            Map<String, HeapValue> fieldValues = new LinkedHashMap<>();
            if (!fields.isEmpty()) {
                Map<Field, Value> jdiFieldValues = objRef.getValues(fields);
                for (Field field : fields) {
                    Value fieldValue = jdiFieldValues.get(field);
                    fieldValues.put(field.name(), traverse(fieldValue, depth + 1, heapCollector));
                }
            }

            heapCollector.put(objectId, factory.createObjectSnapshot(className, fieldValues));
            return factory.createObjectRef(objectId);

        } catch (Exception e) {
            log.warn("Failed to traverse object obj {}: {}", objectId, e.getMessage());
            return factory.createObjectRef(objectId);
        }
    }

    private String getArrayElementTypeName(ArrayReference arrayRef) {
        try {
            ArrayType arrayType = (ArrayType) arrayRef.referenceType();
            String componentTypeName = arrayType.componentTypeName();
            return componentTypeName;
        } catch (Exception e) {
            return "unknown";
        }
    }
}
