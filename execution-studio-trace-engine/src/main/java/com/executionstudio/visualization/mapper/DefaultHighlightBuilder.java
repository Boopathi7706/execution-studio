package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.visualization.model.DisplayValue;
import com.executionstudio.visualization.model.Highlight;
import com.executionstudio.visualization.model.HighlightReason;
import com.executionstudio.visualization.model.HighlightState;
import com.executionstudio.visualization.model.VariableView;
import com.executionstudio.visualization.model.VariablesView;

import java.util.ArrayList;
import java.util.List;

/**
 * Default implementation of {@link HighlightBuilder}.
 */
public class DefaultHighlightBuilder implements HighlightBuilder {

    @Override
    public HighlightState build(ExecutionState state, VariablesView variablesView) {
        List<Highlight> highlights = new ArrayList<>();
        if (state == null) {
            return new HighlightState(0, "", "", highlights);
        }

        int currentLine = state.position().lineNumber();
        String currentMethod = state.context().currentMethod();
        String currentStackFrame = state.context().currentClass();

        // 1. Highlight the current executing line and method
        highlights.add(new Highlight("line:" + currentLine, HighlightReason.CURRENT));
        if (currentMethod != null && !currentMethod.isBlank()) {
            highlights.add(new Highlight("method:" + currentMethod, HighlightReason.CURRENT));
        }

        // 2. Highlight variables and targets that changed
        if (variablesView != null && variablesView.variables() != null) {
            for (VariableView var : variablesView.variables()) {
                if (var.changed()) {
                    // Highlight the variable card itself
                    highlights.add(new Highlight("var:" + var.name(), HighlightReason.CHANGED));

                    // If the variable points to a heap object, highlight that object node too
                    String targetId = getTargetObjectId(var.value());
                    if (targetId != null) {
                        highlights.add(new Highlight(targetId, HighlightReason.CHANGED));
                    }
                }
            }
        }

        return new HighlightState(currentLine, currentMethod, currentStackFrame, highlights);
    }

    private String getTargetObjectId(DisplayValue val) {
        if (val == null) {
            return null;
        }
        return switch (val) {
            case DisplayValue.ObjectRef r -> r.objectId();
            case DisplayValue.ArrayRef r -> r.objectId();
            case DisplayValue.StringVal r -> r.objectId();
            default -> null;
        };
    }
}
