package com.executionstudio.backend.controller;

import com.executionstudio.api.TraceEngineException;
import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.dto.TraceResponseDto;
import com.executionstudio.backend.exception.GlobalExceptionHandler;
import com.executionstudio.backend.service.TraceExecutionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TraceController.class)
@Import(GlobalExceptionHandler.class)
class TraceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TraceExecutionService traceExecutionService;

    @Test
    void shouldSuccessfullyCreateTraceAndReturnTimelineEvents() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto(
            "public class Main { public static void main(String[] args) {} }",
            "Main"
        );

        TraceResponseDto responseDto = new TraceResponseDto(
            "test-exec-123",
            "SUCCESS",
            List.of()
        );

        when(traceExecutionService.executeTrace(any(TraceRequestDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.executionId").value("test-exec-123"))
            .andExpect(jsonPath("$.status").value("SUCCESS"))
            .andExpect(jsonPath("$.timeline").isArray());
    }

    @Test
    void shouldReturnBadRequestWhenSourceCodeIsBlank() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto("", "Main");

        mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value("BAD_REQUEST"))
            .andExpect(jsonPath("$.errors.sourceCode").value("Source code must not be blank"));
    }

    @Test
    void shouldReturnBadRequestWhenClassNameIsBlank() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto("public class Main {}", " ");

        mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value("BAD_REQUEST"))
            .andExpect(jsonPath("$.errors.className").value("Class name must not be blank"));
    }

    @Test
    void shouldReturnBadRequestWhenTraceEngineFails() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto("public class BadCode {}", "BadCode");

        when(traceExecutionService.executeTrace(any(TraceRequestDto.class)))
            .thenThrow(new TraceEngineException("Compilation failed for BadCode.java"));

        mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value("FAILED"))
            .andExpect(jsonPath("$.message").value("Compilation failed for BadCode.java"));
    }
}
