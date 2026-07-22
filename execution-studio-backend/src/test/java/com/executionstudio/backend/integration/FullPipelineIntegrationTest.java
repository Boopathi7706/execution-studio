package com.executionstudio.backend.integration;

import com.executionstudio.backend.dto.TraceRequestDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FullPipelineIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldVerifyHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.application").value("Execution Studio Backend"))
            .andExpect(jsonPath("$.version").value("1.0.0"));
    }

    @Test
    void shouldExecuteFullTracePipelineFromRestApiToJdiAndSerializer() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto(
            """
            public class PipelineDemo {
                public static void main(String[] args) {
                    int a = 10;
                    int b = 20;
                    int sum = a + b;
                }
            }
            """,
            "PipelineDemo"
        );

        // 1. Submit async trace execution request
        MvcResult submitResult = mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isAccepted())
            .andExpect(jsonPath("$.executionId").exists())
            .andExpect(jsonPath("$.status").value("QUEUED"))
            .andReturn();

        JsonNode responseNode = objectMapper.readTree(submitResult.getResponse().getContentAsString());
        String executionId = responseNode.get("executionId").asText();
        assertThat(executionId).isNotBlank();

        // 2. Poll until background execution completes (compilation -> JDI capture -> serialization)
        await().atMost(Duration.ofSeconds(20))
            .untilAsserted(() -> {
                MvcResult pollResult = mockMvc.perform(get("/api/v1/traces/" + executionId))
                    .andExpect(status().isOk())
                    .andReturn();

                JsonNode pollNode = objectMapper.readTree(pollResult.getResponse().getContentAsString());
                String statusStr = pollNode.get("status").asText();
                assertThat(statusStr).isEqualTo("COMPLETED");
                assertThat(pollNode.get("timeline").isArray()).isTrue();
                assertThat(pollNode.get("timeline").size()).isGreaterThan(0);
            });
    }

    @Test
    void shouldHandleCompilationErrorInAsyncPipeline() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto(
            """
            public class InvalidDemo {
                public static void main(String[] args) {
                    int x = ; // Syntax error
                }
            }
            """,
            "InvalidDemo"
        );

        MvcResult submitResult = mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isAccepted())
            .andReturn();

        JsonNode responseNode = objectMapper.readTree(submitResult.getResponse().getContentAsString());
        String executionId = responseNode.get("executionId").asText();

        await().atMost(Duration.ofSeconds(15))
            .untilAsserted(() -> {
                MvcResult pollResult = mockMvc.perform(get("/api/v1/traces/" + executionId))
                    .andExpect(status().isOk())
                    .andReturn();

                JsonNode pollNode = objectMapper.readTree(pollResult.getResponse().getContentAsString());
                assertThat(pollNode.get("status").asText()).isEqualTo("FAILED");
            });
    }

    @Test
    void shouldReturnNotFoundForNonExistentExecutionId() throws Exception {
        mockMvc.perform(get("/api/v1/traces/non-existent-session-id"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.error").value("Not Found"));
    }
}
