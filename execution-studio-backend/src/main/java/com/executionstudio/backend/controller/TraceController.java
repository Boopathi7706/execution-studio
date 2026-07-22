package com.executionstudio.backend.controller;

import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.dto.TraceResponseDto;
import com.executionstudio.backend.service.TraceExecutionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    /**
     * Submits a trace execution request asynchronously.
     * Returns 202 Accepted immediately with executionId and status QUEUED without blocking.
     */
    @PostMapping
    public ResponseEntity<TraceResponseDto> createTrace(@Valid @RequestBody TraceRequestDto requestDto) {
        TraceResponseDto response = traceExecutionService.executeTraceAsync(requestDto);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * Polls the status and timeline results of an execution session.
     */
    @GetMapping("/{executionId}")
    public ResponseEntity<TraceResponseDto> getTraceStatus(@PathVariable String executionId) {
        TraceResponseDto response = traceExecutionService.getTraceStatus(executionId);
        return ResponseEntity.ok(response);
    }
}
