package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.playback.state.ExecutionStateContext;
import com.executionstudio.playback.state.CurrentPosition;
import com.executionstudio.playback.state.HeapState;
import com.executionstudio.playback.state.StackState;
import com.executionstudio.visualization.graph.ReferenceGraph;
import com.executionstudio.visualization.model.ExecutionStatus;
import com.executionstudio.visualization.model.HeapView;
import com.executionstudio.visualization.model.HighlightState;
import com.executionstudio.visualization.model.StackView;
import com.executionstudio.visualization.model.VariablesView;
import com.executionstudio.visualization.model.VisualizationModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class VisualizationAssemblerTest {

    private DefaultVisualizationAssembler assembler;
    private StackView stack;
    private HeapView heap;
    private VariablesView variables;
    private ReferenceGraph graph;
    private HighlightState highlights;

    @BeforeEach
    void setUp() {
        assembler = new DefaultVisualizationAssembler();
        stack = new StackView(List.of());
        heap = new HeapView(Map.of());
        variables = new VariablesView(List.of());
        graph = new ReferenceGraph(List.of(), List.of());
        highlights = new HighlightState(0, "", "", List.of());
    }

    @Test
    void shouldMapStatusToRunningWhenInMiddleStep() {
        ExecutionState state = new ExecutionState(
            new CurrentPosition("Sample.java", 7),
            new StackState(List.of()),
            new HeapState(Map.of()),
            new ExecutionStateContext("Sample", "main", 2, null, null) // index 2
        );

        VisualizationModel model = assembler.assemble(stack, heap, variables, graph, highlights, state, false);

        assertThat(model.status()).isEqualTo(ExecutionStatus.RUNNING);
    }

    @Test
    void shouldMapStatusToCompletedWhenAtLastStep() {
        ExecutionState state = new ExecutionState(
            new CurrentPosition("Sample.java", 15),
            new StackState(List.of()),
            new HeapState(Map.of()),
            new ExecutionStateContext("Sample", "main", 10, null, null) // index 10
        );

        // isLastStep = true
        VisualizationModel model = assembler.assemble(stack, heap, variables, graph, highlights, state, true);

        assertThat(model.status()).isEqualTo(ExecutionStatus.COMPLETED);
    }

    @Test
    void shouldMapStatusToExceptionWhenStepHasException() {
        ExecutionState state = new ExecutionState(
            new CurrentPosition("Sample.java", 15),
            new StackState(List.of()),
            new HeapState(Map.of()),
            new ExecutionStateContext("Sample", "main", 10, "java.lang.ArithmeticException", "/ by zero")
        );

        VisualizationModel model = assembler.assemble(stack, heap, variables, graph, highlights, state, false);

        assertThat(model.status()).isEqualTo(ExecutionStatus.EXCEPTION);
    }
}
