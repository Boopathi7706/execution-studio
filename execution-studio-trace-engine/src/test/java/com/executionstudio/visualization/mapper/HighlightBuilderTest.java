package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.playback.state.ExecutionStateContext;
import com.executionstudio.playback.state.CurrentPosition;
import com.executionstudio.playback.state.HeapState;
import com.executionstudio.playback.state.StackState;
import com.executionstudio.visualization.model.DisplayValue;
import com.executionstudio.visualization.model.Highlight;
import com.executionstudio.visualization.model.HighlightReason;
import com.executionstudio.visualization.model.HighlightState;
import com.executionstudio.visualization.model.VariableView;
import com.executionstudio.visualization.model.VariablesView;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class HighlightBuilderTest {

    private DefaultHighlightBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new DefaultHighlightBuilder();
    }

    @Test
    void shouldBuildHighlightsForCurrentStateAndChangedVariables() {
        ExecutionState state = new ExecutionState(
            new CurrentPosition("Sample.java", 12),
            new StackState(List.of()),
            new HeapState(Map.of()),
            new ExecutionStateContext("Sample", "main", 0, null, null)
        );

        // Variable 'a' has changed. Points to obj_1 reference
        VariablesView variables = new VariablesView(List.of(
            new VariableView("a", "Point", new DisplayValue.ObjectRef("obj_1"), "main", true),
            new VariableView("b", "int", new DisplayValue.Primitive("5"), "main", false)
        ));

        HighlightState result = builder.build(state, variables);

        assertThat(result.currentLine()).isEqualTo(12);
        assertThat(result.currentMethod()).isEqualTo("main");
        assertThat(result.currentStackFrame()).isEqualTo("Sample");

        // Highlights should contain line, method, changed variable, and target object node
        assertThat(result.activeHighlights()).hasSize(4);

        assertThat(result.activeHighlights()).contains(
            new Highlight("line:12", HighlightReason.CURRENT),
            new Highlight("method:main", HighlightReason.CURRENT),
            new Highlight("var:a", HighlightReason.CHANGED),
            new Highlight("obj_1", HighlightReason.CHANGED)
        );
    }
}
