package com.executionstudio.backend.service;

import com.executionstudio.api.TraceEngine;
import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.dto.TraceResponseDto;
import com.executionstudio.backend.model.ExecutionStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

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
    void shouldExecuteSourceCodeAndReturnResponseDtoAsync() {
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

        TraceResponseDto response = traceExecutionService.executeTraceAsync(requestDto);

        assertThat(response).isNotNull();
        assertThat(response.executionId()).isNotBlank();
        assertThat(response.status()).isIn(ExecutionStatus.QUEUED.name(), ExecutionStatus.RUNNING.name(), ExecutionStatus.COMPLETED.name());

        await().atMost(Duration.ofSeconds(15))
            .untilAsserted(() -> {
                TraceResponseDto current = traceExecutionService.getTraceStatus(response.executionId());
                assertThat(current.status()).isEqualTo(ExecutionStatus.COMPLETED.name());
                assertThat(current.timeline()).isNotNull();
            });
    }
}
