package com.executionstudio.visualization.graph;

import com.executionstudio.visualization.model.DisplayValue;
import com.executionstudio.visualization.model.HeapObjectView;
import com.executionstudio.visualization.model.HeapView;
import com.executionstudio.visualization.model.VariableView;
import com.executionstudio.visualization.model.VariablesView;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Default implementation of {@link GraphBuilder}.
 */
public class DefaultGraphBuilder implements GraphBuilder {

    @Override
    public ReferenceGraph build(HeapView heapView, VariablesView variablesView) {
        List<GraphNode> nodes = new ArrayList<>();
        List<GraphEdge> edges = new ArrayList<>();

        Set<String> addedNodeIds = new HashSet<>();
        Set<String> addedEdgeSigs = new HashSet<>();

        // 1. Process variables to identify root entry nodes
        if (variablesView != null && variablesView.variables() != null) {
            for (VariableView var : variablesView.variables()) {
                String targetId = getTargetObjectId(var.value());
                if (targetId != null) {
                    // Variable references a heap object; add variable node & reference edge
                    String varNodeId = "var:" + var.name();
                    if (addedNodeIds.add(varNodeId)) {
                        nodes.add(new GraphNode(varNodeId, var.name(), NodeType.PRIMITIVE));
                    }

                    String edgeSig = varNodeId + "->" + targetId;
                    if (addedEdgeSigs.add(edgeSig)) {
                        edges.add(new GraphEdge(varNodeId, targetId, EdgeType.VARIABLE_REFERENCE));
                    }
                }
            }
        }

        // 2. Process heap objects to build object nodes and child edges
        if (heapView != null && heapView.objects() != null) {
            for (HeapObjectView obj : heapView.objects().values()) {
                String nodeId = obj.objectId();

                // Add heap object node
                if (addedNodeIds.add(nodeId)) {
                    NodeType type = "array".equals(obj.type()) ? NodeType.ARRAY : NodeType.OBJECT;
                    nodes.add(new GraphNode(nodeId, obj.classNameOrType(), type));
                }

                // Scan fields/elements for child references
                if (obj.fieldsOrElements() != null) {
                    boolean isArray = "array".equals(obj.type());
                    EdgeType relation = isArray ? EdgeType.ARRAY_ELEMENT : EdgeType.FIELD;

                    for (DisplayValue val : obj.fieldsOrElements().values()) {
                        String targetId = getTargetObjectId(val);
                        if (targetId != null) {
                            String edgeSig = nodeId + "->" + targetId;
                            if (addedEdgeSigs.add(edgeSig)) {
                                edges.add(new GraphEdge(nodeId, targetId, relation));
                            }
                        }
                    }
                }
            }
        }

        return new ReferenceGraph(nodes, edges);
    }

    private String getTargetObjectId(DisplayValue val) {
        if (val == null) {
            return null;
        }
        return switch (val) {
            case DisplayValue.ObjectRef r -> r.objectId();
            case DisplayValue.ArrayRef r -> r.objectId();
            case DisplayValue.StringVal r -> r.objectId();
            default -> null;
        };
    }
}
