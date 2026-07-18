package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.runtime.events.HeapObject;
import com.executionstudio.runtime.events.HeapValue;
import com.executionstudio.visualization.model.DisplayValue;
import com.executionstudio.visualization.model.HeapObjectView;
import com.executionstudio.visualization.model.HeapView;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Default implementation of {@link HeapMapper}.
 */
public class DefaultHeapMapper implements HeapMapper {

    private final DefaultVariableMapper valueMapper = new DefaultVariableMapper();

    @Override
    public HeapView map(ExecutionState state) {
        Map<String, HeapObjectView> objectViews = new LinkedHashMap<>();
        if (state == null || state.heap() == null || state.heap().objects() == null) {
            return new HeapView(objectViews);
        }

        for (Map.Entry<String, HeapObject> entry : state.heap().objects().entrySet()) {
            String objectId = entry.getKey();
            HeapObject obj = entry.getValue();

            String type = obj.type();
            String classNameOrType;
            Map<String, DisplayValue> fieldsOrElements = new LinkedHashMap<>();

            if (obj instanceof HeapObject.ObjectSnapshot objectSnapshot) {
                classNameOrType = objectSnapshot.className();
                if (objectSnapshot.fields() != null) {
                    for (Map.Entry<String, HeapValue> fieldEntry : objectSnapshot.fields().entrySet()) {
                        fieldsOrElements.put(
                            fieldEntry.getKey(),
                            valueMapper.mapToDisplayValue(fieldEntry.getValue())
                        );
                    }
                }
            } else if (obj instanceof HeapObject.ArraySnapshot arraySnapshot) {
                classNameOrType = arraySnapshot.elementType();
                if (arraySnapshot.elements() != null) {
                    for (int i = 0; i < arraySnapshot.elements().size(); i++) {
                        fieldsOrElements.put(
                            String.valueOf(i),
                            valueMapper.mapToDisplayValue(arraySnapshot.elements().get(i))
                        );
                    }
                }
            } else {
                continue; // Skip unknown variants
            }

            objectViews.put(objectId, new HeapObjectView(
                objectId,
                type,
                classNameOrType,
                fieldsOrElements
            ));
        }

        return new HeapView(objectViews);
    }
}
