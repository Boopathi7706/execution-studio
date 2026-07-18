package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.playback.state.FrameState;
import com.executionstudio.visualization.graph.DefaultGraphBuilder;
import com.executionstudio.visualization.graph.GraphBuilder;
import com.executionstudio.visualization.graph.ReferenceGraph;
import com.executionstudio.visualization.model.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Default implementation of {@link VisualizationMapper}.
 *
 * <p>Delegates sub-view mapping responsibilities to focused sub-mappers:
 * StackMapper, HeapMapper, VariableMapper, GraphBuilder, HighlightBuilder,
 * and VisualizationAssembler.</p>
 */
public class DefaultVisualizationMapper implements VisualizationMapper {

    private final StackMapper stackMapper;
    private final HeapMapper heapMapper;
    private final VariableMapper variableMapper;
    private final GraphBuilder graphBuilder;
    private final HighlightBuilder highlightBuilder;
    private final VisualizationAssembler assembler;

    public DefaultVisualizationMapper() {
        this.variableMapper = new DefaultVariableMapper();
        this.stackMapper = new DefaultStackMapper(variableMapper);
        this.heapMapper = new DefaultHeapMapper();
        this.graphBuilder = new DefaultGraphBuilder();
        this.highlightBuilder = new DefaultHighlightBuilder();
        this.assembler = new DefaultVisualizationAssembler();
    }

    @Override
    public VisualizationModel map(ExecutionState state, ExecutionState previousState, boolean isLastStep) {
        if (state == null) {
            throw new IllegalArgumentException("ExecutionState cannot be null");
        }

        // 1. Map Stack frames & variables
        StackView stack = stackMapper.map(state, previousState);

        // 2. Map Heap objects & arrays
        HeapView heap = heapMapper.map(state);

        // 3. Collect variables scoped to top active frame for display
        List<VariableView> activeLocals = new ArrayList<>();
        if (stack.frames() != null && !stack.frames().isEmpty()) {
            FrameView topFrame = stack.frames().get(0);
            if (topFrame.locals() != null) {
                activeLocals.addAll(topFrame.locals());
            }
        }
        VariablesView variables = new VariablesView(activeLocals);

        // 4. Construct generic reference graph
        ReferenceGraph graph = graphBuilder.build(heap, variables);

        // 5. Build highlights
        HighlightState highlights = highlightBuilder.build(state, variables);

        // 6. Assemble into unified VisualizationModel
        return assembler.assemble(stack, heap, variables, graph, highlights, state, isLastStep);
    }
}
