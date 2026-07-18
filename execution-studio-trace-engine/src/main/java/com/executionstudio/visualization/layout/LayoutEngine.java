package com.executionstudio.visualization.layout;

import com.executionstudio.visualization.model.VisualizationModel;

/**
 * Purely functional interface for visual layout calculations.
 *
 * <p>Responsibility: Map visualization model component details to Point2D coordinates
 * without mutating the visualization model.</p>
 */
public interface LayoutEngine {

    /**
     * Compute visual locations for graph nodes, variable cards, or frame components.
     *
     * @param model the immutable visualization model
     * @return the calculated layout positions
     */
    LayoutModel calculateLayout(VisualizationModel model);
}
