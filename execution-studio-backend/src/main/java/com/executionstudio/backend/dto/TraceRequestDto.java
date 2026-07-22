package com.executionstudio.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record TraceRequestDto(
    @NotBlank(message = "Source code must not be blank")
    String sourceCode,

    @NotBlank(message = "Class name must not be blank")
    String className
) {}
