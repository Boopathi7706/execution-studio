package com.executionstudio.visualization.model;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * Representation of runtime values mapped for generic display purposes.
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind")
@JsonSubTypes({
    @JsonSubTypes.Type(value = DisplayValue.Primitive.class, name = "primitive"),
    @JsonSubTypes.Type(value = DisplayValue.ObjectRef.class, name = "object_ref"),
    @JsonSubTypes.Type(value = DisplayValue.ArrayRef.class, name = "array_ref"),
    @JsonSubTypes.Type(value = DisplayValue.StringVal.class, name = "string"),
    @JsonSubTypes.Type(value = DisplayValue.NullVal.class, name = "null")
})
public sealed interface DisplayValue permits
    DisplayValue.Primitive,
    DisplayValue.ObjectRef,
    DisplayValue.ArrayRef,
    DisplayValue.StringVal,
    DisplayValue.NullVal
{
    /** Returns the kind discriminator string. */
    String kind();

    record Primitive(String valueString) implements DisplayValue {
        @Override public String kind() { return "primitive"; }
    }

    record ObjectRef(String objectId) implements DisplayValue {
        @Override public String kind() { return "object_ref"; }
    }

    record ArrayRef(String objectId) implements DisplayValue {
        @Override public String kind() { return "array_ref"; }
    }

    record StringVal(String value, String objectId) implements DisplayValue {
        @Override public String kind() { return "string"; }
    }

    record NullVal() implements DisplayValue {
        @Override public String kind() { return "null"; }
    }
}
