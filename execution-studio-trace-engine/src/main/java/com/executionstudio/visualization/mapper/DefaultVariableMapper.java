package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.FrameState;
import com.executionstudio.playback.state.VariableState;
import com.executionstudio.runtime.events.HeapValue;
import com.executionstudio.visualization.model.DisplayValue;
import com.executionstudio.visualization.model.VariableView;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Default implementation of {@link VariableMapper}.
 */
public class DefaultVariableMapper implements VariableMapper {

    @Override
    public List<VariableView> mapVariables(FrameState currentFrame, FrameState previousFrame) {
        List<VariableView> visualLocals = new ArrayList<>();
        if (currentFrame == null || currentFrame.locals() == null) {
            return visualLocals;
        }

        // Map previous variables by name for quick change detection comparison
        Map<String, VariableState> previousLocalsMap = new HashMap<>();
        if (previousFrame != null && previousFrame.locals() != null) {
            for (VariableState prev : previousFrame.locals()) {
                previousLocalsMap.put(prev.name(), prev);
            }
        }

        String scope = currentFrame.methodName();

        for (VariableState currentVar : currentFrame.locals()) {
            boolean changed = false;

            // Perform change detection
            if (previousFrame != null) {
                VariableState prevVar = previousLocalsMap.get(currentVar.name());
                if (prevVar == null) {
                    // Variable is new in this scope
                    changed = true;
                } else {
                    // Compare values directly
                    changed = !currentVar.value().equals(prevVar.value());
                }
            }

            // Map HeapValue -> DisplayValue
            DisplayValue visualValue = mapToDisplayValue(currentVar.value());

            visualLocals.add(new VariableView(
                currentVar.name(),
                currentVar.declaredType(),
                visualValue,
                scope,
                changed
            ));
        }

        return visualLocals;
    }

    /**
     * Map JDI-independent HeapValue DTOs to DisplayValue presentation models.
     */
    public DisplayValue mapToDisplayValue(HeapValue val) {
        if (val == null) {
            return new DisplayValue.NullVal();
        }

        return switch (val) {
            case HeapValue.IntValue v -> new DisplayValue.Primitive(String.valueOf(v.value()));
            case HeapValue.LongValue v -> new DisplayValue.Primitive(String.valueOf(v.value()));
            case HeapValue.FloatValue v -> new DisplayValue.Primitive(String.valueOf(v.value()));
            case HeapValue.DoubleValue v -> new DisplayValue.Primitive(String.valueOf(v.value()));
            case HeapValue.BooleanValue v -> new DisplayValue.Primitive(String.valueOf(v.value()));
            case HeapValue.CharValue v -> new DisplayValue.Primitive(v.value());
            case HeapValue.StringValue v -> new DisplayValue.StringVal(v.value(), v.objectId());
            case HeapValue.NullValue ignored -> new DisplayValue.NullVal();
            case HeapValue.ObjectRefValue v -> new DisplayValue.ObjectRef(v.objectId());
            case HeapValue.ArrayRefValue v -> new DisplayValue.ArrayRef(v.objectId());
        };
    }
}
