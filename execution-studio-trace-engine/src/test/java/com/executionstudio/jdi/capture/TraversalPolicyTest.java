package com.executionstudio.jdi.capture;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class TraversalPolicyTest {

    @Test
    void shouldAllowTraversalWithinDepthLimit() {
        TraversalPolicy policy = new TraversalPolicy(3, 100, 50);
        assertThat(policy.shouldTraverse(1L, 0)).isTrue();
        assertThat(policy.shouldTraverse(2L, 1)).isTrue();
        assertThat(policy.shouldTraverse(3L, 2)).isTrue();
    }

    @Test
    void shouldRejectTraversalBeyondDepthLimit() {
        TraversalPolicy policy = new TraversalPolicy(3, 100, 50);
        assertThat(policy.shouldTraverse(1L, 3)).isFalse();
        assertThat(policy.shouldTraverse(2L, 4)).isFalse();
    }

    @Test
    void shouldDetectCycles() {
        TraversalPolicy policy = new TraversalPolicy(10, 100, 50);
        assertThat(policy.shouldTraverse(42L, 0)).isTrue();
        policy.markVisited(42L);
        // Same object should be rejected (cycle detection)
        assertThat(policy.shouldTraverse(42L, 0)).isFalse();
    }

    @Test
    void shouldEnforceObjectCountLimit() {
        TraversalPolicy policy = new TraversalPolicy(10, 3, 50);
        // Mark 3 objects visited
        policy.markVisited(1L);
        policy.markVisited(2L);
        policy.markVisited(3L);
        // 4th object should be rejected
        assertThat(policy.shouldTraverse(4L, 0)).isFalse();
    }

    @Test
    void shouldResetBetweenSteps() {
        TraversalPolicy policy = new TraversalPolicy(3, 100, 50);
        policy.markVisited(1L);
        assertThat(policy.shouldTraverse(1L, 0)).isFalse(); // Visited
        policy.reset();
        assertThat(policy.shouldTraverse(1L, 0)).isTrue(); // Reset, should be allowed
    }

    @Test
    void shouldReportMaxArrayElements() {
        TraversalPolicy policy = new TraversalPolicy(3, 100, 25);
        assertThat(policy.getMaxArrayElements()).isEqualTo(25);
    }
}
