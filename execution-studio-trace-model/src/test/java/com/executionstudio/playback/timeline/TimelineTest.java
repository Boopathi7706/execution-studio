package com.executionstudio.playback.timeline;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TimelineTest {

    @Test
    void shouldInitializeAtZero() {
        Timeline timeline = new DefaultTimeline(10);
        assertThat(timeline.currentIndex()).isEqualTo(0);
        assertThat(timeline.hasNext()).isTrue();
        assertThat(timeline.hasPrevious()).isFalse();
    }

    @Test
    void shouldReturnCorrectIndexNavigationProperties() {
        Timeline timeline = new DefaultTimeline(5); // Indexes: 0, 1, 2, 3, 4
        assertThat(timeline.currentIndex()).isEqualTo(0);
        assertThat(timeline.nextIndex()).isEqualTo(1);
        assertThat(timeline.previousIndex()).isEqualTo(0);

        timeline.seek(2);
        assertThat(timeline.currentIndex()).isEqualTo(2);
        assertThat(timeline.nextIndex()).isEqualTo(3);
        assertThat(timeline.previousIndex()).isEqualTo(1);
        assertThat(timeline.hasNext()).isTrue();
        assertThat(timeline.hasPrevious()).isTrue();

        timeline.seek(4);
        assertThat(timeline.currentIndex()).isEqualTo(4);
        assertThat(timeline.nextIndex()).isEqualTo(4);
        assertThat(timeline.previousIndex()).isEqualTo(3);
        assertThat(timeline.hasNext()).isFalse();
        assertThat(timeline.hasPrevious()).isTrue();
    }

    @Test
    void shouldResetToStart() {
        Timeline timeline = new DefaultTimeline(5);
        timeline.seek(3);
        assertThat(timeline.currentIndex()).isEqualTo(3);
        timeline.reset();
        assertThat(timeline.currentIndex()).isEqualTo(0);
    }

    @Test
    void shouldRejectOutOfBoundsSeek() {
        Timeline timeline = new DefaultTimeline(5);

        assertThatThrownBy(() -> timeline.seek(-1))
            .isInstanceOf(IndexOutOfBoundsException.class)
            .hasMessageContaining("out of bounds");

        assertThatThrownBy(() -> timeline.seek(5))
            .isInstanceOf(IndexOutOfBoundsException.class)
            .hasMessageContaining("out of bounds");
    }

    @Test
    void shouldHandleEmptyTimelineGracefully() {
        Timeline timeline = new DefaultTimeline(0);
        assertThat(timeline.currentIndex()).isEqualTo(0);
        assertThat(timeline.firstIndex()).isEqualTo(0);
        assertThat(timeline.lastIndex()).isEqualTo(0);
        assertThat(timeline.hasNext()).isFalse();
        assertThat(timeline.hasPrevious()).isFalse();

        // Seek 0 on empty is fine
        timeline.seek(0);
        assertThat(timeline.currentIndex()).isEqualTo(0);

        // Seek out of bounds throws
        assertThatThrownBy(() -> timeline.seek(1))
            .isInstanceOf(IndexOutOfBoundsException.class);
    }
}
