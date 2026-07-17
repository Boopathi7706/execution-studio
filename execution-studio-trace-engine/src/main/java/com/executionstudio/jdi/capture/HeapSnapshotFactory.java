package com.executionstudio.jdi.capture;

import com.executionstudio.runtime.events.HeapObject;
import com.executionstudio.runtime.events.HeapValue;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Factory for creating heap snapshot DTOs from traversal data.
 *
 * <p>Pure conversion — no traversal logic, no policy decisions. Creates
 * {@link HeapValue} and {@link HeapObject} instances from already-extracted data.</p>
 */
public class HeapSnapshotFactory {

    // --- Primitive value constructors ---

    public HeapValue createIntValue(int value) {
        return new HeapValue.IntValue(value);
    }

    public HeapValue createLongValue(long value) {
        return new HeapValue.LongValue(value);
    }

    public HeapValue createFloatValue(float value) {
        return new HeapValue.FloatValue(value);
    }

    public HeapValue createDoubleValue(double value) {
        return new HeapValue.DoubleValue(value);
    }

    public HeapValue createBooleanValue(boolean value) {
        return new HeapValue.BooleanValue(value);
    }

    public HeapValue createCharValue(char value) {
        return new HeapValue.CharValue(String.valueOf(value));
    }

    // --- Reference value constructors ---

    public HeapValue createStringValue(String value, String objectId) {
        return new HeapValue.StringValue(value, objectId);
    }

    public HeapValue createNullValue() {
        return new HeapValue.NullValue();
    }

    public HeapValue createObjectRef(String objectId) {
        return new HeapValue.ObjectRefValue(objectId);
    }

    public HeapValue createArrayRef(String objectId) {
        return new HeapValue.ArrayRefValue(objectId);
    }

    // --- Heap object constructors ---

    public HeapObject createObjectSnapshot(String className, Map<String, HeapValue> fields) {
        return new HeapObject.ObjectSnapshot(className, new LinkedHashMap<>(fields));
    }

    public HeapObject createArraySnapshot(String elementType, int length,
                                           List<HeapValue> elements, boolean truncated) {
        return new HeapObject.ArraySnapshot(elementType, length, List.copyOf(elements), truncated);
    }
}
