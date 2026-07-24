package com.executionstudio.backend.service;

import com.executionstudio.api.TraceEngine;
import com.executionstudio.api.TraceRequest;
import com.executionstudio.api.TraceResult;
import com.executionstudio.backend.config.BackendProperties;
import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.dto.TraceResponseDto;
import com.executionstudio.backend.model.ExecutionSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * Service orchestrating execution and tracing tasks by delegating async sessions to ExecutionManager.
 */
@Service
public class TraceExecutionService {

    private final TraceEngine traceEngine;
    private final BackendProperties backendProperties;
    private final StorageService storageService;
    private final ExecutionManager executionManager;

    @Autowired
    public TraceExecutionService(
            TraceEngine traceEngine,
            BackendProperties backendProperties,
            StorageService storageService,
            ExecutionManager executionManager) {
        this.traceEngine = Objects.requireNonNull(traceEngine, "TraceEngine must not be null");
        this.backendProperties = Objects.requireNonNull(backendProperties, "BackendProperties must not be null");
        this.storageService = Objects.requireNonNull(storageService, "StorageService must not be null");
        this.executionManager = Objects.requireNonNull(executionManager, "ExecutionManager must not be null");
    }

    /**
     * Submits trace execution asynchronously and returns a TraceResponseDto immediately with status QUEUED.
     *
     * @param requestDto REST request containing source code and class name
     * @return REST response DTO containing execution ID, status, and timeline (null initially)
     */
    public TraceResponseDto executeTraceAsync(TraceRequestDto requestDto) {
        ExecutionSession session = executionManager.submitTraceRequest(requestDto);
        return new TraceResponseDto(
            session.getExecutionId(),
            session.getStatus().name(),
            session.getTimeline(),
            session.getErrorMessage()
        );
    }

    /**
     * Retrieves status and timeline results of an execution session.
     *
     * @param executionId execution ID
     * @return REST response DTO
     */
    public TraceResponseDto getTraceStatus(String executionId) {
        ExecutionSession session = executionManager.getSession(executionId);
        return new TraceResponseDto(
            session.getExecutionId(),
            session.getStatus().name(),
            session.getTimeline(),
            session.getErrorMessage()
        );
    }

    /**
     * Synchronous trace execution delegate.
     */
    public TraceResult executeTrace(TraceRequest request) {
        return traceEngine.execute(request);
    }

    public BackendProperties getBackendProperties() {
        return backendProperties;
    }

    public StorageService getStorageService() {
        return storageService;
    }

    public ExecutionManager getExecutionManager() {
        return executionManager;
    }
}
