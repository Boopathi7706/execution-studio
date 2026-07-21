package com.executionstudio.runtime.events;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * Discriminated union representing a value captured from the debuggee VM.
 *
 * <p>Each variant carries the actual value in a type-safe way. Object and array
 * references carry a synthetic {@code objectId} for heap lookup.</p>
 *
 * <p>This is a sealed interface to enable exhaustive pattern matching in Java 17+.
 * The {@code kind} field serves as the JSON discriminator.</p>
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind")
@JsonSubTypes({
    @JsonSubTypes.Type(value = HeapValue.IntValue.class, name = "int"),
    @JsonSubTypes.Type(value = HeapValue.LongValue.class, name = "long"),
    @JsonSubTypes.Type(value = HeapValue.FloatValue.class, name = "float"),
    @JsonSubTypes.Type(value = HeapValue.DoubleValue.class, name = "double"),
    @JsonSubTypes.Type(value = HeapValue.BooleanValue.class, name = "boolean"),
    @JsonSubTypes.Type(value = HeapValue.CharValue.class, name = "char"),
    @JsonSubTypes.Type(value = HeapValue.StringValue.class, name = "string"),
    @JsonSubTypes.Type(value = HeapValue.NullValue.class, name = "null"),
    @JsonSubTypes.Type(value = HeapValue.ObjectRefValue.class, name = "object_ref"),
    @JsonSubTypes.Type(value = HeapValue.ArrayRefValue.class, name = "array_ref"),
})
public sealed interface HeapValue
    permits HeapValue.IntValue, HeapValue.LongValue, HeapValue.FloatValue,
            HeapValue.DoubleValue, HeapValue.BooleanValue, HeapValue.CharValue,
            HeapValue.StringValue, HeapValue.NullValue,
            HeapValue.ObjectRefValue, HeapValue.ArrayRefValue {

    /** Returns the kind discriminator string for serialization. */
    String kind();

    // --- Primitive value types ---

    record IntValue(int value) implements HeapValue {
        @Override public String kind() { return "int"; }
    }

    record LongValue(long value) implements HeapValue {
        @Override public String kind() { return "long"; }
    }

    record FloatValue(float value) implements HeapValue {
        @Override public String kind() { return "float"; }
    }

    record DoubleValue(double value) implements HeapValue {
        @Override public String kind() { return "double"; }
    }

    record BooleanValue(boolean value) implements HeapValue {
        @Override public String kind() { return "boolean"; }
    }

    record CharValue(String value) implements HeapValue {
        @Override public String kind() { return "char"; }
    }

    // --- Reference value types ---

    record StringValue(String value, String objectId) implements HeapValue {
        @Override public String kind() { return "string"; }
    }

    record NullValue() implements HeapValue {
        @Override public String kind() { return "null"; }
    }

    record ObjectRefValue(String objectId) implements HeapValue {
        @Override public String kind() { return "object_ref"; }
    }

    record ArrayRefValue(String objectId) implements HeapValue {
        @Override public String kind() { return "array_ref"; }
    }
}
