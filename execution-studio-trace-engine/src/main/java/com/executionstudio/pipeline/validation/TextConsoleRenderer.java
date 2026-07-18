package com.executionstudio.pipeline.validation;

import com.executionstudio.visualization.graph.GraphEdge;
import com.executionstudio.visualization.model.*;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Text-based console renderer for {@link VisualizationModel} snapshots.
 *
 * <p>Serves as a validator renderer to prove that the model contains
 * all details necessary for drawing interactive graphical components.</p>
 */
public class TextConsoleRenderer {

    /**
     * Render the visualization model as a formatted string.
     *
     * @param model the visualization model snapshot
     * @return the ASCII rendering representation
     */
    public String render(VisualizationModel model) {
        if (model == null) {
            return "NULL VISUALIZATION MODEL";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("================================================================================\n");
        sb.append(String.format("LINE: %-5d | METHOD: %-15s | CLASS: %-15s | STATUS: %s\n",
            model.highlights().currentLine(),
            model.highlights().currentMethod(),
            model.highlights().currentStackFrame(),
            model.status()
        ));
        sb.append("================================================================================\n");

        // 1. Stack View
        sb.append("-- CALL STACK --\n");
        if (model.stack() != null && model.stack().frames() != null) {
            for (FrameView frame : model.stack().frames()) {
                String activeIndicator = frame.isActive() ? " * " : "   ";
                sb.append(String.format("%s%s.%s() line %d\n",
                    activeIndicator, frame.className(), frame.methodName(), frame.lineNumber()
                ));
            }
        } else {
            sb.append("   (Empty Stack)\n");
        }
        sb.append("\n");

        // 2. Local Variables (from the top/active stack frame)
        sb.append("-- LOCAL VARIABLES --\n");
        if (model.variables() != null && model.variables().variables() != null && !model.variables().variables().isEmpty()) {
            for (VariableView var : model.variables().variables()) {
                String changedIndicator = var.changed() ? " [CHANGED]" : "";
                sb.append(String.format("   %-10s (%-15s): %s%s\n",
                    var.name(), var.declaredType(), formatValue(var.value()), changedIndicator
                ));
            }
        } else {
            sb.append("   (No Local Variables)\n");
        }
        sb.append("\n");

        // 3. Heap Area Snapshots
        sb.append("-- HEAP Snapshots --\n");
        if (model.heap() != null && model.heap().objects() != null && !model.heap().objects().isEmpty()) {
            for (HeapObjectView obj : model.heap().objects().values()) {
                String fieldsString = "";
                if (obj.fieldsOrElements() != null) {
                    fieldsString = obj.fieldsOrElements().entrySet().stream()
                        .map(e -> e.getKey() + ": " + formatValue(e.getValue()))
                        .collect(Collectors.joining(", ", "{", "}"));
                }
                sb.append(String.format("   [%s] (%s) %s -> %s\n",
                    obj.objectId(), obj.type(), obj.classNameOrType(), fieldsString
                ));
            }
        } else {
            sb.append("   (Empty Heap)\n");
        }
        sb.append("\n");

        // 4. Reference Graph Nodes/Edges
        sb.append("-- REFERENCE GRAPH --\n");
        if (model.graph() != null) {
            int nodeCount = model.graph().nodes() != null ? model.graph().nodes().size() : 0;
            int edgeCount = model.graph().edges() != null ? model.graph().edges().size() : 0;
            sb.append(String.format("   Nodes: %d | Edges: %d\n", nodeCount, edgeCount));
            if (model.graph().edges() != null && !model.graph().edges().isEmpty()) {
                for (GraphEdge edge : model.graph().edges()) {
                    sb.append(String.format("   (%s) -[%s]-> (%s)\n",
                        edge.source(), edge.relationshipType(), edge.target()
                    ));
                }
            }
        } else {
            sb.append("   (No Graph Model)\n");
        }
        sb.append("\n");

        // 5. Highlights and Focuses
        sb.append("-- HIGHLIGHTS --\n");
        if (model.highlights() != null && model.highlights().activeHighlights() != null && !model.highlights().activeHighlights().isEmpty()) {
            for (Highlight hl : model.highlights().activeHighlights()) {
                sb.append(String.format("   Target: %-25s | Reason: %s\n",
                    hl.targetId(), hl.reason()
                ));
            }
        } else {
            sb.append("   (No Highlights)\n");
        }
        sb.append("================================================================================\n");

        return sb.toString();
    }

    private String formatValue(DisplayValue val) {
        if (val == null) {
            return "null";
        }
        return switch (val) {
            case DisplayValue.Primitive p -> p.valueString();
            case DisplayValue.ObjectRef r -> "ref(" + r.objectId() + ")";
            case DisplayValue.ArrayRef r -> "ref(" + r.objectId() + ")";
            case DisplayValue.StringVal s -> "\"" + s.value() + "\" (ref(" + s.objectId() + "))";
            case DisplayValue.NullVal ignored -> "null";
        };
    }
}
