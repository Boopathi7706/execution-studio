package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.FrameState;
import com.executionstudio.visualization.model.VariableView;
import java.util.List;

/**
 * Converts local variables from runtime models to visualization views, performing change detection.
 */
public interface VariableMapper {

    /**
     * Map runtime variables inside a stack frame into visual variable representations.
     *
     * @param currentFrame  current stack frame state
     * @param previousFrame previous stack frame state (nullable, for comparing variables)
     * @return list of visual variables
     */
    List<VariableView> mapVariables(FrameState currentFrame, FrameState previousFrame);
}
