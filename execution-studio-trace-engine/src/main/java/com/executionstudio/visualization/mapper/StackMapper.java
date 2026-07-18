package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.visualization.model.StackView;

/**
 * Converts stack frames from execution state into visualization views.
 */
public interface StackMapper {

    /**
     * Map stack frame runtime models to stack visual structures.
     *
     * @param state         current execution state
     * @param previousState previous execution state (nullable, for variable change checks)
     * @return stack visualization DTO
     */
    StackView map(ExecutionState state, ExecutionState previousState);
}
