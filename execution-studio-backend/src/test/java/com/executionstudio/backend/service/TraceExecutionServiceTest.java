package com.executionstudio.backend.service;

import com.executionstudio.api.TraceEngine;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class TraceExecutionServiceTest {

    @Autowired
    private TraceExecutionService traceExecutionService;

    @Autowired
    private TraceEngine traceEngine;

    @Test
    void shouldSuccessfullyVerifyBeanDependencyInjection() {
        assertThat(traceEngine).isNotNull();
        assertThat(traceExecutionService).isNotNull();
    }
}
