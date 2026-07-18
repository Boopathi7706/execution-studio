package com.executionstudio.visualization.validation;

import com.executionstudio.visualization.exception.InvalidVisualizationModelException;
import com.executionstudio.visualization.graph.*;
import com.executionstudio.visualization.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VisualizationValidatorTest {

    private VisualizationValidator validator;
    private StackView validStack;
    private HeapView validHeap;
    private VariablesView validVariables;
    private HighlightState validHighlights;

    @BeforeEach
    void setUp() {
        validator = new VisualizationValidator();
        validStack = new StackView(List.of());
        validHeap = new HeapView(Map.of());
        validVariables = new VariablesView(List.of());
        validHighlights = new HighlightState(0, "", "", List.of());
    }

    @Test
    void shouldPassValidModel() {
        ReferenceGraph validGraph = new ReferenceGraph(
            List.of(new GraphNode("obj_1", "Point", NodeType.OBJECT)),
            List.of()
        );

        VisualizationModel model = new VisualizationModel(
            validStack, validHeap, validVariables, validGraph, validHighlights, ExecutionStatus.RUNNING
        );

        assertThatCode(() -> validator.validate(model)).doesNotThrowAnyException();
    }

    @Test
    void shouldRejectDuplicateNodeIds() {
        ReferenceGraph invalidGraph = new ReferenceGraph(
            List.of(
                new GraphNode("obj_1", "Point", NodeType.OBJECT),
                new GraphNode("obj_1", "AnotherPoint", NodeType.OBJECT) // Duplicate
            ),
            List.of()
        );

        VisualizationModel model = new VisualizationModel(
            validStack, validHeap, validVariables, invalidGraph, validHighlights, ExecutionStatus.RUNNING
        );

        assertThatThrownBy(() -> validator.validate(model))
            .isInstanceOf(InvalidVisualizationModelException.class)
            .hasMessageContaining("Duplicate graph node ID detected");
    }

    @Test
    void shouldRejectDanglingEdges() {
        ReferenceGraph invalidGraph = new ReferenceGraph(
            List.of(new GraphNode("obj_1", "Point", NodeType.OBJECT)),
            List.of(
                new GraphEdge("obj_1", "obj_99", EdgeType.FIELD) // Target obj_99 does not exist
            )
        );

        VisualizationModel model = new VisualizationModel(
            validStack, validHeap, validVariables, invalidGraph, validHighlights, ExecutionStatus.RUNNING
        );

        assertThatThrownBy(() -> validator.validate(model))
            .isInstanceOf(InvalidVisualizationModelException.class)
            .hasMessageContaining("Dangling edge target detected");
    }

    @Test
    void shouldRejectHighlightTargetingMissingObjectNode() {
        ReferenceGraph graph = new ReferenceGraph(List.of(), List.of());
        HighlightState highlights = new HighlightState(12, "main", "Sample", List.of(
            new Highlight("obj_99", HighlightReason.CHANGED) // obj_99 does not exist in graph nodes
        ));

        VisualizationModel model = new VisualizationModel(
            validStack, validHeap, validVariables, graph, highlights, ExecutionStatus.RUNNING
        );

        assertThatThrownBy(() -> validator.validate(model))
            .isInstanceOf(InvalidVisualizationModelException.class)
            .hasMessageContaining("references a non-existent graph node");
    }

    @Test
    void shouldAcceptHighlightTargetingLineOrVariable() {
        ReferenceGraph graph = new ReferenceGraph(List.of(), List.of());
        HighlightState highlights = new HighlightState(12, "main", "Sample", List.of(
            new Highlight("line:12", HighlightReason.CURRENT),
            new Highlight("var:a", HighlightReason.CHANGED)
        ));

        VisualizationModel model = new VisualizationModel(
            validStack, validHeap, validVariables, graph, highlights, ExecutionStatus.RUNNING
        );

        assertThatCode(() -> validator.validate(model)).doesNotThrowAnyException();
    }
}
