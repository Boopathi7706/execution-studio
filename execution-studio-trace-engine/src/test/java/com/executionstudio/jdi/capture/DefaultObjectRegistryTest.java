package com.executionstudio.jdi.capture;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class DefaultObjectRegistryTest {

    @Test
    void shouldAssignFirstIdAsObj1() {
        DefaultObjectRegistry registry = new DefaultObjectRegistry();
        String id = registry.getOrAssignId(100L);
        assertThat(id).isEqualTo("obj_1");
    }

    @Test
    void shouldReturnSameIdForSameJdiUniqueId() {
        DefaultObjectRegistry registry = new DefaultObjectRegistry();
        String id1 = registry.getOrAssignId(100L);
        String id2 = registry.getOrAssignId(100L);
        assertThat(id1).isEqualTo(id2);
    }

    @Test
    void shouldAssignDifferentIdsForDifferentJdiUniqueIds() {
        DefaultObjectRegistry registry = new DefaultObjectRegistry();
        String id1 = registry.getOrAssignId(100L);
        String id2 = registry.getOrAssignId(200L);
        String id3 = registry.getOrAssignId(300L);
        assertThat(id1).isEqualTo("obj_1");
        assertThat(id2).isEqualTo("obj_2");
        assertThat(id3).isEqualTo("obj_3");
    }

    @Test
    void shouldTrackKnownObjects() {
        DefaultObjectRegistry registry = new DefaultObjectRegistry();
        assertThat(registry.isKnown(100L)).isFalse();
        registry.getOrAssignId(100L);
        assertThat(registry.isKnown(100L)).isTrue();
        assertThat(registry.isKnown(200L)).isFalse();
    }

    @Test
    void shouldTrackTotalObjects() {
        DefaultObjectRegistry registry = new DefaultObjectRegistry();
        assertThat(registry.totalObjects()).isEqualTo(0);
        registry.getOrAssignId(100L);
        assertThat(registry.totalObjects()).isEqualTo(1);
        registry.getOrAssignId(200L);
        assertThat(registry.totalObjects()).isEqualTo(2);
        registry.getOrAssignId(100L); // Duplicate
        assertThat(registry.totalObjects()).isEqualTo(2);
    }

    @Test
    void shouldAssignIdsMonotonically() {
        DefaultObjectRegistry registry = new DefaultObjectRegistry();
        for (int i = 1; i <= 10; i++) {
            String id = registry.getOrAssignId(i * 1000L);
            assertThat(id).isEqualTo("obj_" + i);
        }
    }
}
