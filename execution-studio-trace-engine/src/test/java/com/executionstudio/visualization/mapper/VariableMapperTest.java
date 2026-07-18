package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.FrameState;
import com.executionstudio.playback.state.VariableState;
import com.executionstudio.runtime.events.HeapValue;
import com.executionstudio.visualization.model.DisplayValue;
import com.executionstudio.visualization.model.VariableView;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class VariableMapperTest {

    private DefaultVariableMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new DefaultVariableMapper();
    }

    @Test
    void shouldMapPrimitiveVariablesWithoutChangeOnNullPrevious() {
        FrameState currentFrame = new FrameState("Sample", "main", 7, List.of(
            new VariableState("a", "int", new HeapValue.IntValue(10))
        ));

        List<VariableView> result = mapper.mapVariables(currentFrame, null);

        assertThat(result).hasSize(1);
        VariableView varView = result.get(0);
        assertThat(varView.name()).isEqualTo("a");
        assertThat(varView.declaredType()).isEqualTo("int");
        assertThat(varView.value()).isInstanceOf(DisplayValue.Primitive.class);
        assertThat(((DisplayValue.Primitive) varView.value()).valueString()).isEqualTo("10");
        assertThat(varView.scope()).isEqualTo("main");
        assertThat(varView.changed()).isFalse();
    }

    @Test
    void shouldDetectChangedVariablesWhenValuesDiffer() {
        FrameState currentFrame = new FrameState("Sample", "main", 8, List.of(
            new VariableState("a", "int", new HeapValue.IntValue(15)) // value updated to 15
        ));

        FrameState previousFrame = new FrameState("Sample", "main", 7, List.of(
            new VariableState("a", "int", new HeapValue.IntValue(10)) // old value was 10
        ));

        List<VariableView> result = mapper.mapVariables(currentFrame, previousFrame);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).changed()).isTrue();
    }

    @Test
    void shouldMarkUnchangedWhenValuesAreEqual() {
        FrameState currentFrame = new FrameState("Sample", "main", 8, List.of(
            new VariableState("a", "int", new HeapValue.IntValue(10))
        ));

        FrameState previousFrame = new FrameState("Sample", "main", 7, List.of(
            new VariableState("a", "int", new HeapValue.IntValue(10))
        ));

        List<VariableView> result = mapper.mapVariables(currentFrame, previousFrame);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).changed()).isFalse();
    }

    @Test
    void shouldMarkChangedWhenVariableIsNewInScope() {
        FrameState currentFrame = new FrameState("Sample", "main", 8, List.of(
            new VariableState("b", "int", new HeapValue.IntValue(20)) // variable "b" newly added
        ));

        FrameState previousFrame = new FrameState("Sample", "main", 7, List.of(
            new VariableState("a", "int", new HeapValue.IntValue(10))
        ));

        List<VariableView> result = mapper.mapVariables(currentFrame, previousFrame);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).changed()).isTrue();
    }
}
