package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.visualization.model.HeapView;

/**
 * Converts heap objects and arrays from execution state into visualization views.
 */
public interface HeapMapper {

    /**
     * Map heap snapshot models to visual heap structures.
     *
     * @param state current execution state
     * @return heap visualization DTO
     */
    HeapView map(ExecutionState state);
}
