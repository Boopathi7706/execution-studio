package com.executionstudio.visualization.validation;

import com.executionstudio.visualization.exception.InvalidVisualizationModelException;
import com.executionstudio.visualization.graph.GraphEdge;
import com.executionstudio.visualization.graph.GraphNode;
import com.executionstudio.visualization.model.*;

import java.util.HashSet;
import java.util.Set;

/**
 * Validates the consistency and semantic integrity of a {@link VisualizationModel}.
 */
public class VisualizationValidator {

    /**
     * Validate the visualization model DTO.
     *
     * @param model the visualization model to validate
     * @throws InvalidVisualizationModelException if consistency checks fail
     */
    public void validate(VisualizationModel model) throws InvalidVisualizationModelException {
        if (model == null) {
            throw new InvalidVisualizationModelException("VisualizationModel is null");
        }

        Set<String> nodeIds = new HashSet<>();

        // 1. Validate Reference Graph Nodes for duplicate IDs
        if (model.graph() != null && model.graph().nodes() != null) {
            for (int i = 0; i < model.graph().nodes().size(); i++) {
                GraphNode node = model.graph().nodes().get(i);
                if (node == null) {
                    throw new InvalidVisualizationModelException("Graph contains a null node at index " + i);
                }
                if (node.id() == null || node.id().isBlank()) {
                    throw new InvalidVisualizationModelException("Graph node ID is null or blank at index " + i);
                }
                if (!nodeIds.add(node.id())) {
                    throw new InvalidVisualizationModelException("Duplicate graph node ID detected: " + node.id());
                }
                if (node.label() == null || node.label().isBlank()) {
                    throw new InvalidVisualizationModelException("Graph node label is null or blank for ID: " + node.id());
                }
                if (node.type() == null) {
                    throw new InvalidVisualizationModelException("Graph node type is null for ID: " + node.id());
                }
            }
        }

        // 2. Validate Reference Graph Edges for dangling pointers
        if (model.graph() != null && model.graph().edges() != null) {
            for (int i = 0; i < model.graph().edges().size(); i++) {
                GraphEdge edge = model.graph().edges().get(i);
                if (edge == null) {
                    throw new InvalidVisualizationModelException("Graph contains a null edge at index " + i);
                }
                if (edge.source() == null || edge.source().isBlank()) {
                    throw new InvalidVisualizationModelException("Graph edge source is null or blank at index " + i);
                }
                if (edge.target() == null || edge.target().isBlank()) {
                    throw new InvalidVisualizationModelException("Graph edge target is null or blank at index " + i);
                }
                if (edge.relationshipType() == null) {
                    throw new InvalidVisualizationModelException("Graph edge relationshipType is null at index " + i);
                }

                // Dangling pointer checks
                if (!nodeIds.contains(edge.source())) {
                    throw new InvalidVisualizationModelException(
                        String.format("Dangling edge source detected: node ID '%s' is missing from graph definitions",
                            edge.source())
                    );
                }
                if (!nodeIds.contains(edge.target())) {
                    throw new InvalidVisualizationModelException(
                        String.format("Dangling edge target detected: node ID '%s' is missing from graph definitions",
                            edge.target())
                    );
                }
            }
        }

        // 3. Validate Highlights match defined targets
        if (model.highlights() != null && model.highlights().activeHighlights() != null) {
            for (int i = 0; i < model.highlights().activeHighlights().size(); i++) {
                Highlight hl = model.highlights().activeHighlights().get(i);
                if (hl == null) {
                    throw new InvalidVisualizationModelException("Highlights list contains a null highlight at index " + i);
                }
                if (hl.targetId() == null || hl.targetId().isBlank()) {
                    throw new InvalidVisualizationModelException("Highlight targetId is null or blank at index " + i);
                }
                if (hl.reason() == null) {
                    throw new InvalidVisualizationModelException("Highlight reason is null at index " + i);
                }

                // Verify target references either variables, lines, methods, or graph nodes
                String targetId = hl.targetId();
                if (!targetId.startsWith("line:") && !targetId.startsWith("method:") && !targetId.startsWith("var:")) {
                    // Object reference; must exist in node registry
                    if (!nodeIds.contains(targetId)) {
                        throw new InvalidVisualizationModelException(
                            String.format("Highlight targetId '%s' references a non-existent graph node", targetId)
                        );
                    }
                }
            }
        }

        // 4. Validate Execution Status
        if (model.status() == null) {
            throw new InvalidVisualizationModelException("ExecutionStatus is null");
        }
    }
}
