package com.executionstudio.visualization.graph;

import com.executionstudio.visualization.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GraphBuilderTest {

    private DefaultGraphBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new DefaultGraphBuilder();
    }

    @Test
    void shouldBuildNodesAndEdgesWithCorrectTypesAndReferences() {
        // Variable "arr" references obj_1
        VariablesView variables = new VariablesView(List.of(
            new VariableView("arr", "int[]", new DisplayValue.ArrayRef("obj_1"), "main", false)
        ));

        // Heap contains obj_1 (array containing Int 10 and reference to obj_2)
        HeapView heap = new HeapView(Map.of(
            "obj_1", new HeapObjectView("obj_1", "array", "int[]", Map.of(
                "0", new DisplayValue.Primitive("10"),
                "1", new DisplayValue.ObjectRef("obj_2")
            )),
            "obj_2", new HeapObjectView("obj_2", "object", "Point", Map.of(
                "x", new DisplayValue.Primitive("5")
            ))
        ));

        ReferenceGraph graph = builder.build(heap, variables);

        // Nodes validation
        assertThat(graph.nodes()).hasSize(3); // var:arr, obj_1, obj_2
        assertThat(graph.nodes()).extracting(GraphNode::id)
            .containsExactlyInAnyOrder("var:arr", "obj_1", "obj_2");

        GraphNode varNode = graph.nodes().stream().filter(n -> n.id().equals("var:arr")).findFirst().orElseThrow();
        assertThat(varNode.type()).isEqualTo(NodeType.PRIMITIVE);

        GraphNode arrayNode = graph.nodes().stream().filter(n -> n.id().equals("obj_1")).findFirst().orElseThrow();
        assertThat(arrayNode.type()).isEqualTo(NodeType.ARRAY);

        GraphNode objectNode = graph.nodes().stream().filter(n -> n.id().equals("obj_2")).findFirst().orElseThrow();
        assertThat(objectNode.type()).isEqualTo(NodeType.OBJECT);

        // Edges validation
        assertThat(graph.edges()).hasSize(2);

        // Edge 1: var:arr -> obj_1 (VARIABLE_REFERENCE)
        GraphEdge edge1 = graph.edges().stream().filter(e -> e.source().equals("var:arr")).findFirst().orElseThrow();
        assertThat(edge1.target()).isEqualTo("obj_1");
        assertThat(edge1.relationshipType()).isEqualTo(EdgeType.VARIABLE_REFERENCE);

        // Edge 2: obj_1 -> obj_2 (ARRAY_ELEMENT)
        GraphEdge edge2 = graph.edges().stream().filter(e -> e.source().equals("obj_1")).findFirst().orElseThrow();
        assertThat(edge2.target()).isEqualTo("obj_2");
        assertThat(edge2.relationshipType()).isEqualTo(EdgeType.ARRAY_ELEMENT);
    }
}
