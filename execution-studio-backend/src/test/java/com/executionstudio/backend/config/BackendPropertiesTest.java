package com.executionstudio.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BackendPropertiesTest {

    @Autowired
    private BackendProperties backendProperties;

    @Test
    void shouldLoadExternalizedConfigurationProperties() {
        assertThat(backendProperties).isNotNull();
        assertThat(backendProperties.getTempDirectory()).isNotBlank();
        assertThat(backendProperties.getUploadDirectory()).isNotBlank();
        assertThat(backendProperties.getTimeoutSeconds()).isEqualTo(10);
        assertThat(backendProperties.getObjectDepth()).isEqualTo(5);
        assertThat(backendProperties.getStepLimit()).isEqualTo(1000);
        assertThat(backendProperties.getSerializer()).isNotNull();
        assertThat(backendProperties.getSerializer().isPrettyPrint()).isTrue();
        assertThat(backendProperties.getSerializer().isIncludeNulls()).isFalse();
    }
}
