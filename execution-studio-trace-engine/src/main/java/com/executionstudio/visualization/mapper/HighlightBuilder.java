package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.visualization.model.HighlightState;
import com.executionstudio.visualization.model.VariablesView;

/**
 * Interface for building active visual highlight focuses.
 */
public interface HighlightBuilder {

    /**
     * Build highlight settings based on runtime state and variable change markers.
     *
     * @param state         current execution state
     * @param variablesView mapped variables view
     * @return highlight state DTO
     */
    HighlightState build(ExecutionState state, VariablesView variablesView);
}
