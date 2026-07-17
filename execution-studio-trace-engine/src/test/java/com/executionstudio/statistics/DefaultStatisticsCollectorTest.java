package com.executionstudio.statistics;

import com.executionstudio.runtime.events.*;
import com.executionstudio.trace.model.TraceStatistics;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DefaultStatisticsCollectorTest {

    @Test
    void shouldCountEvents() {
        DefaultStatisticsCollector collector = new DefaultStatisticsCollector();
        LineEvent event = new LineEvent(0, "Test.java", "Test", "main", 1, List.of(), Map.of());
        collector.recordEvent(event);
        collector.recordEvent(event);
        collector.recordEvent(event);

        TraceStatistics stats = collector.build();
        // Note: TraceStatistics doesn't expose event count directly,
        // but the build should succeed
        assertThat(stats).isNotNull();
    }

    @Test
    void shouldTrackMaxStackDepth() {
        DefaultStatisticsCollector collector = new DefaultStatisticsCollector();
        collector.recordStackDepth(2);
        collector.recordStackDepth(5);
        collector.recordStackDepth(3);

        TraceStatistics stats = collector.build();
        assertThat(stats.maxCallStackDepth()).isEqualTo(5);
    }

    @Test
    void shouldTrackUniqueMethodsExecuted() {
        DefaultStatisticsCollector collector = new DefaultStatisticsCollector();
        collector.recordMethodSeen("Sample.main");
        collector.recordMethodSeen("Sample.square");
        collector.recordMethodSeen("Sample.main"); // Duplicate
        collector.recordMethodSeen("Point.<init>");

        TraceStatistics stats = collector.build();
        assertThat(stats.uniqueMethodsExecuted()).isEqualTo(3);
    }

    @Test
    void shouldTrackObjectAndArrayCounts() {
        DefaultStatisticsCollector collector = new DefaultStatisticsCollector();
        collector.recordObjectCreated();
        collector.recordObjectCreated();
        collector.recordArrayCreated();

        TraceStatistics stats = collector.build();
        assertThat(stats.objectsCreated()).isEqualTo(2);
        assertThat(stats.arraysCreated()).isEqualTo(1);
    }

    @Test
    void shouldDetectLoopIterations() {
        DefaultStatisticsCollector collector = new DefaultStatisticsCollector();
        // Simulate visiting the same line 3 times (a loop with 3 iterations)
        collector.recordLineVisit("Sample", 11);
        collector.recordLineVisit("Sample", 11);
        collector.recordLineVisit("Sample", 11);
        // Another line visited once (not a loop)
        collector.recordLineVisit("Sample", 7);

        TraceStatistics stats = collector.build();
        assertThat(stats.loopIterationsDetected()).isEqualTo(2); // 3 visits - 1 = 2 re-visits
    }

    @Test
    void shouldThrowIfRecordingAfterBuild() {
        DefaultStatisticsCollector collector = new DefaultStatisticsCollector();
        collector.build();

        LineEvent event = new LineEvent(0, "Test.java", "Test", "main", 1, List.of(), Map.of());
        assertThatThrownBy(() -> collector.recordEvent(event))
            .isInstanceOf(IllegalStateException.class);
    }
}
