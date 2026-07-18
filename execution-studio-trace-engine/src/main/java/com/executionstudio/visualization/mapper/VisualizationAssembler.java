package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.visualization.graph.ReferenceGraph;
import com.executionstudio.visualization.model.HeapView;
import com.executionstudio.visualization.model.HighlightState;
import com.executionstudio.visualization.model.StackView;
import com.executionstudio.visualization.model.VariablesView;
import com.executionstudio.visualization.model.VisualizationModel;

/**
 * Interface for assembling individual visualization parts into the final model.
 */
public interface VisualizationAssembler {

    /**
     * Assemble sub-mapper views into a unified immutable VisualizationModel.
     *
     * @param stack      call stack view
     * @param heap       heap view
     * @param variables  scoped variables view
     * @param graph      object relationship graph
     * @param highlights highlight flags
     * @param state      raw execution state (to extract status, exception flags)
     * @return assembled visualization model DTO
     */
    VisualizationModel assemble(
        StackView stack,
        HeapView heap,
        VariablesView variables,
        ReferenceGraph graph,
        HighlightState highlights,
        ExecutionState state,
        boolean isLastStep
    );
}
