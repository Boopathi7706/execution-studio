package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.visualization.model.VisualizationModel;

/**
 * Interface responsible for converting JDI-independent execution state into presentation-friendly models.
 */
public interface VisualizationMapper {

    /**
     * Map runtime execution state to presentation visualization models.
     *
     * @param state         current execution state
     * @param previousState previous execution state (nullable, for comparing variables)
     * @param isLastStep    true if this state is the final step in the trace
     * @return presentation model DTO
     */
    VisualizationModel map(ExecutionState state, ExecutionState previousState, boolean isLastStep);
}
