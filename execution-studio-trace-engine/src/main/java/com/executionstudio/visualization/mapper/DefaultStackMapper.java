package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.playback.state.FrameState;
import com.executionstudio.visualization.model.FrameView;
import com.executionstudio.visualization.model.StackView;
import com.executionstudio.visualization.model.VariableView;

import java.util.ArrayList;
import java.util.List;

/**
 * Default implementation of {@link StackMapper}.
 */
public class DefaultStackMapper implements StackMapper {

    private final VariableMapper variableMapper;

    public DefaultStackMapper(VariableMapper variableMapper) {
        if (variableMapper == null) {
            throw new IllegalArgumentException("variableMapper cannot be null");
        }
        this.variableMapper = variableMapper;
    }

    @Override
    public StackView map(ExecutionState state, ExecutionState previousState) {
        List<FrameView> frameViews = new ArrayList<>();
        if (state == null || state.stack() == null || state.stack().frames() == null) {
            return new StackView(frameViews);
        }

        List<FrameState> currentFrames = state.stack().frames();
        List<FrameState> previousFrames = (previousState != null && previousState.stack() != null)
            ? previousState.stack().frames()
            : List.of();

        for (int i = 0; i < currentFrames.size(); i++) {
            FrameState currentFrame = currentFrames.get(i);
            FrameState previousFrame = (i < previousFrames.size()) ? previousFrames.get(i) : null;

            // Map variables using variableMapper
            List<VariableView> locals = variableMapper.mapVariables(currentFrame, previousFrame);

            // Active frame indicator (top frame at index 0 is active)
            boolean isActive = (i == 0);

            frameViews.add(new FrameView(
                currentFrame.className(),
                currentFrame.methodName(),
                currentFrame.lineNumber(),
                locals,
                isActive
            ));
        }

        return new StackView(frameViews);
    }
}
