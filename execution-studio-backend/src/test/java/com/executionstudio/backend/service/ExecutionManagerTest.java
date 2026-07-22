package com.executionstudio.backend.service;

import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.model.ExecutionSession;
import com.executionstudio.backend.model.ExecutionStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest
class ExecutionManagerTest {

    @Autowired
    private ExecutionManager executionManager;

    @Test
    void shouldReturnSessionImmediatelyWithQueuedStatusAndCompleteAsynchronously() {
        TraceRequestDto requestDto = new TraceRequestDto(
            """
            public class AsyncTest {
                public static void main(String[] args) {
                    int a = 1;
                    int b = 2;
                }
            }
            """,
            "AsyncTest"
        );

        ExecutionSession session = executionManager.submitTraceRequest(requestDto);

        assertThat(session).isNotNull();
        assertThat(session.getExecutionId()).isNotBlank();
        assertThat(session.getStatus()).isIn(ExecutionStatus.QUEUED, ExecutionStatus.RUNNING, ExecutionStatus.COMPLETED);

        // Await asynchronous execution completion
        await().atMost(Duration.ofSeconds(15))
            .untilAsserted(() -> {
                ExecutionSession current = executionManager.getSession(session.getExecutionId());
                assertThat(current.getStatus()).isEqualTo(ExecutionStatus.COMPLETED);
                assertThat(current.getTimeline()).isNotNull();
            });
    }

    @Test
    void shouldMarkSessionFailedWhenCompilationOrExecutionFails() {
        TraceRequestDto requestDto = new TraceRequestDto(
            """
            public class BadCode {
                public static void main(String[] args) {
                    int x = ; // Syntax error
                }
            }
            """,
            "BadCode"
        );

        ExecutionSession session = executionManager.submitTraceRequest(requestDto);

        await().atMost(Duration.ofSeconds(15))
            .untilAsserted(() -> {
                ExecutionSession current = executionManager.getSession(session.getExecutionId());
                assertThat(current.getStatus()).isEqualTo(ExecutionStatus.FAILED);
                assertThat(current.getErrorMessage()).isNotBlank();
            });
    }
}
