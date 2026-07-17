package com.executionstudio.context;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class SequenceGeneratorTest {

    @Test
    void shouldStartAtZero() {
        SequenceGenerator gen = new SequenceGenerator();
        assertThat(gen.next()).isEqualTo(0);
    }

    @Test
    void shouldIncrementMonotonically() {
        SequenceGenerator gen = new SequenceGenerator();
        assertThat(gen.next()).isEqualTo(0);
        assertThat(gen.next()).isEqualTo(1);
        assertThat(gen.next()).isEqualTo(2);
        assertThat(gen.next()).isEqualTo(3);
    }

    @Test
    void currentShouldReturnNextValueWithoutIncrementing() {
        SequenceGenerator gen = new SequenceGenerator();
        assertThat(gen.current()).isEqualTo(0);
        gen.next();
        assertThat(gen.current()).isEqualTo(1);
        assertThat(gen.current()).isEqualTo(1); // Unchanged
    }
}
