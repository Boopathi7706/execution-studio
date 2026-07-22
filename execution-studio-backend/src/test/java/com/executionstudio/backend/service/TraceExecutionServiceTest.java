package com.executionstudio.backend.service;

import com.executionstudio.api.TraceEngine;
import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.dto.TraceResponseDto;
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

    @Test
    void shouldExecuteSourceCodeAndReturnResponseDto() {
        TraceRequestDto requestDto = new TraceRequestDto(
            """
            public class SampleApp {
                public static void main(String[] args) {
                    int x = 10;
                    int y = 20;
                    int sum = x + y;
                }
            }
            """,
            "SampleApp"
        );

        TraceResponseDto response = traceExecutionService.executeTrace(requestDto);

        assertThat(response).isNotNull();
        assertThat(response.executionId()).isNotBlank();
        assertThat(response.status()).isEqualTo("SUCCESS");
        assertThat(response.timeline()).isNotNull();
    }
}
