package com.executionstudio.backend.controller;

import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.dto.TraceResponseDto;
import com.executionstudio.backend.service.TraceExecutionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Objects;

@RestController
@RequestMapping("/api/v1/traces")
public class TraceController {

    private final TraceExecutionService traceExecutionService;

    @Autowired
    public TraceController(TraceExecutionService traceExecutionService) {
        this.traceExecutionService = Objects.requireNonNull(traceExecutionService, "TraceExecutionService must not be null");
    }

    @PostMapping
    public ResponseEntity<TraceResponseDto> createTrace(@Valid @RequestBody TraceRequestDto requestDto) {
        TraceResponseDto response = traceExecutionService.executeTrace(requestDto);
        return ResponseEntity.ok(response);
    }
}
