package com.executionstudio.visualization.graph;

import com.executionstudio.visualization.model.HeapView;
import com.executionstudio.visualization.model.VariablesView;

/**
 * Interface for building reference graphs representing variable allocations and heap links.
 */
public interface GraphBuilder {

    /**
     * Build the reference graph from visual heap and variables states.
     *
     * @param heapView      mapped heap view
     * @param variablesView mapped variables view
     * @return reference graph DTO
     */
    ReferenceGraph build(HeapView heapView, VariablesView variablesView);
}
