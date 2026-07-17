package com.executionstudio.watchdog;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class WatchdogTest {

    @Test
    void shouldNotBeExceededInitially() {
        Watchdog watchdog = new Watchdog();
        watchdog.start(100, 10);
        assertThat(watchdog.isExceeded()).isFalse();
        assertThat(watchdog.terminationReason()).isEqualTo("normal_exit");
    }

    @Test
    void shouldDetectStepLimitExceeded() {
        Watchdog watchdog = new Watchdog();
        watchdog.start(5, 60);

        for (int i = 0; i < 5; i++) {
            watchdog.recordStep();
        }

        assertThat(watchdog.isExceeded()).isTrue();
        assertThat(watchdog.terminationReason()).isEqualTo("step_cap_exceeded");
    }

    @Test
    void shouldTrackStepCount() {
        Watchdog watchdog = new Watchdog();
        watchdog.start(100, 60);

        watchdog.recordStep();
        watchdog.recordStep();
        watchdog.recordStep();

        assertThat(watchdog.getStepCount()).isEqualTo(3);
    }

    @Test
    void shouldNotBeExceededBeforeStart() {
        Watchdog watchdog = new Watchdog();
        assertThat(watchdog.isExceeded()).isFalse();
    }

    @Test
    void shouldStopCleanly() {
        Watchdog watchdog = new Watchdog();
        watchdog.start(100, 60);
        watchdog.recordStep();
        watchdog.stop();
        // After stopping, isExceeded should return false
        assertThat(watchdog.isExceeded()).isFalse();
    }
}
