package com.executionstudio.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * Standardized REST API Error Response DTO.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    int status,
    String error,
    String message,
    String path,
    LocalDateTime timestamp,
    Object details
) {
    public ErrorResponse(int status, String error, String message, String path) {
        this(status, error, message, path, LocalDateTime.now(), null);
    }

    public ErrorResponse(int status, String error, String message, String path, Object details) {
        this(status, error, message, path, LocalDateTime.now(), details);
    }
}
