package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.visualization.graph.ReferenceGraph;
import com.executionstudio.visualization.model.ExecutionStatus;
import com.executionstudio.visualization.model.HeapView;
import com.executionstudio.visualization.model.HighlightState;
import com.executionstudio.visualization.model.StackView;
import com.executionstudio.visualization.model.VariablesView;
import com.executionstudio.visualization.model.VisualizationModel;

/**
 * Default implementation of {@link VisualizationAssembler}.
 */
public class DefaultVisualizationAssembler implements VisualizationAssembler {

    @Override
    public VisualizationModel assemble(
            StackView stack,
            HeapView heap,
            VariablesView variables,
            ReferenceGraph graph,
            HighlightState highlights,
            ExecutionState state,
            boolean isLastStep) {

        ExecutionStatus status = ExecutionStatus.RUNNING;

        if (state != null && state.context() != null) {
            if (state.context().exceptionType() != null) {
                status = ExecutionStatus.EXCEPTION;
            } else if (isLastStep) {
                status = ExecutionStatus.COMPLETED;
            }
        }

        return new VisualizationModel(
            stack,
            heap,
            variables,
            graph,
            highlights,
            status
        );
    }
}
