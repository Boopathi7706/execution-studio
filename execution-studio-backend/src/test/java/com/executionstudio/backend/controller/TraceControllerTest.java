package com.executionstudio.backend.controller;

import com.executionstudio.api.TraceEngineException;
import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.dto.TraceResponseDto;
import com.executionstudio.backend.exception.CompilationException;
import com.executionstudio.backend.exception.GlobalExceptionHandler;
import com.executionstudio.backend.exception.ResourceNotFoundException;
import com.executionstudio.backend.exception.ValidationException;
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
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.error").value("Bad Request"))
            .andExpect(jsonPath("$.message").value("Validation failed"))
            .andExpect(jsonPath("$.details.sourceCode").value("Source code must not be blank"));
    }

    @Test
    void shouldReturnBadRequestWhenClassNameIsBlank() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto("public class Main {}", " ");

        mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.error").value("Bad Request"))
            .andExpect(jsonPath("$.message").value("Validation failed"))
            .andExpect(jsonPath("$.details.className").value("Class name must not be blank"));
    }

    @Test
    void shouldReturnBadRequestForValidationException() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto("public class Main {}", "Main");

        when(traceExecutionService.executeTrace(any(TraceRequestDto.class)))
            .thenThrow(new ValidationException("Custom validation failed"));

        mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.error").value("Bad Request"))
            .andExpect(jsonPath("$.message").value("Custom validation failed"));
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
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.error").value("Trace Engine Error"))
            .andExpect(jsonPath("$.message").value("Compilation failed for BadCode.java"));
    }

    @Test
    void shouldReturnBadRequestForCompilationException() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto("public class SyntaxError {}", "SyntaxError");

        when(traceExecutionService.executeTrace(any(TraceRequestDto.class)))
            .thenThrow(new CompilationException("Syntax error at line 5", List.of("line 5: expected ';'")));

        mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.error").value("Compilation Error"))
            .andExpect(jsonPath("$.message").value("Syntax error at line 5"))
            .andExpect(jsonPath("$.details[0]").value("line 5: expected ';'"));
    }

    @Test
    void shouldReturnNotFoundForMissingResource() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto("public class Main {}", "Main");

        when(traceExecutionService.executeTrace(any(TraceRequestDto.class)))
            .thenThrow(new ResourceNotFoundException("Trace session not found"));

        mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.error").value("Not Found"))
            .andExpect(jsonPath("$.message").value("Trace session not found"));
    }

    @Test
    void shouldReturnInternalServerErrorForUnhandledExceptions() throws Exception {
        TraceRequestDto requestDto = new TraceRequestDto("public class Main {}", "Main");

        when(traceExecutionService.executeTrace(any(TraceRequestDto.class)))
            .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(post("/api/v1/traces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.status").value(500))
            .andExpect(jsonPath("$.error").value("Internal Server Error"))
            .andExpect(jsonPath("$.message").value("An unexpected error occurred: Database error"));
    }
}
