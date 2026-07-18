package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.playback.state.ExecutionStateContext;
import com.executionstudio.playback.state.FrameState;
import com.executionstudio.playback.state.CurrentPosition;
import com.executionstudio.playback.state.HeapState;
import com.executionstudio.playback.state.StackState;
import com.executionstudio.visualization.model.FrameView;
import com.executionstudio.visualization.model.StackView;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class StackMapperTest {

    private DefaultStackMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new DefaultStackMapper(new DefaultVariableMapper());
    }

    @Test
    void shouldMapStackAndFlagActiveFrameCorrectly() {
        FrameState topFrame = new FrameState("Sample", "square", 3, List.of());
        FrameState bottomFrame = new FrameState("Sample", "main", 12, List.of());

        ExecutionState state = new ExecutionState(
            new CurrentPosition("Sample.java", 3),
            new StackState(List.of(topFrame, bottomFrame)),
            new HeapState(Map.of()),
            new ExecutionStateContext("Sample", "square", 0, null, null)
        );

        StackView result = mapper.map(state, null);

        assertThat(result.frames()).hasSize(2);

        FrameView topView = result.frames().get(0);
        assertThat(topView.methodName()).isEqualTo("square");
        assertThat(topView.isActive()).isTrue();

        FrameView bottomView = result.frames().get(1);
        assertThat(bottomView.methodName()).isEqualTo("main");
        assertThat(bottomView.isActive()).isFalse();
    }
}
