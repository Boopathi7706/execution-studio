package com.executionstudio.visualization.mapper;

import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.playback.state.ExecutionStateContext;
import com.executionstudio.playback.state.CurrentPosition;
import com.executionstudio.playback.state.HeapState;
import com.executionstudio.playback.state.StackState;
import com.executionstudio.runtime.events.HeapObject;
import com.executionstudio.runtime.events.HeapValue;
import com.executionstudio.visualization.model.DisplayValue;
import com.executionstudio.visualization.model.HeapObjectView;
import com.executionstudio.visualization.model.HeapView;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class HeapMapperTest {

    private DefaultHeapMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new DefaultHeapMapper();
    }

    @Test
    void shouldMapHeapObjectsAndArraysCorrectly() {
        Map<String, HeapObject> objects = Map.of(
            "obj_1", new HeapObject.ObjectSnapshot("Point", Map.of(
                "x", new HeapValue.IntValue(10)
            )),
            "obj_2", new HeapObject.ArraySnapshot("int", 2, List.of(
                new HeapValue.IntValue(100), new HeapValue.IntValue(200)
            ), false)
        );

        ExecutionState state = new ExecutionState(
            new CurrentPosition("Sample.java", 7),
            new StackState(List.of()),
            new HeapState(objects),
            new ExecutionStateContext("Sample", "main", 0, null, null)
        );

        HeapView result = mapper.map(state);

        assertThat(result.objects()).hasSize(2);

        HeapObjectView pointView = result.objects().get("obj_1");
        assertThat(pointView.type()).isEqualTo("object");
        assertThat(pointView.classNameOrType()).isEqualTo("Point");
        assertThat(pointView.fieldsOrElements().get("x")).isInstanceOf(DisplayValue.Primitive.class);
        assertThat(((DisplayValue.Primitive) pointView.fieldsOrElements().get("x")).valueString()).isEqualTo("10");

        HeapObjectView arrayView = result.objects().get("obj_2");
        assertThat(arrayView.type()).isEqualTo("array");
        assertThat(arrayView.classNameOrType()).isEqualTo("int");
        assertThat(arrayView.fieldsOrElements().get("0")).isInstanceOf(DisplayValue.Primitive.class);
        assertThat(((DisplayValue.Primitive) arrayView.fieldsOrElements().get("0")).valueString()).isEqualTo("100");
    }
}
