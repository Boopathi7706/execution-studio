package com.executionstudio.backend.dto;

/**
 * REST response DTO for trace execution sessions.
 */
public record TraceResponseDto(
    String executionId,
    String status,
    Object timeline,
    String errorMessage
) {
    public TraceResponseDto(String executionId, String status, Object timeline) {
        this(executionId, status, timeline, null);
    }
}
