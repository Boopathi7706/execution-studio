package com.executionstudio.backend.dto;

public record TraceResponseDto(
    String executionId,
    String status,
    Object timeline
) {}
