package com.executionstudio.backend.service;

import com.executionstudio.api.TraceEngine;
import com.executionstudio.api.TraceEngineException;
import com.executionstudio.api.TraceRequest;
import com.executionstudio.api.TraceResult;
import com.executionstudio.backend.config.BackendProperties;
import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.dto.TraceResponseDto;
import com.executionstudio.playback.exception.PlaybackException;
import com.executionstudio.playback.loader.JacksonTraceLoader;
import com.executionstudio.trace.model.ExecutionTrace;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Objects;
import java.util.UUID;

/**
 * Service orchestrating execution and tracing tasks using standard Spring bean delegation
 * and externalized configuration properties. File handling is delegated to StorageService.
 */
@Service
public class TraceExecutionService {

    private static final Logger log = LoggerFactory.getLogger(TraceExecutionService.class);

    private final TraceEngine traceEngine;
    private final BackendProperties backendProperties;
    private final StorageService storageService;

    @Autowired
    public TraceExecutionService(TraceEngine traceEngine, BackendProperties backendProperties, StorageService storageService) {
        this.traceEngine = Objects.requireNonNull(traceEngine, "TraceEngine must not be null");
        this.backendProperties = Objects.requireNonNull(backendProperties, "BackendProperties must not be null");
        this.storageService = Objects.requireNonNull(storageService, "StorageService must not be null");
    }

    /**
     * Executes trace compilation and event capture for a REST request DTO.
     * Uses StorageService for workspace creation, file writing, and cleanup.
     *
     * @param requestDto REST request containing source code and class name
     * @return REST response DTO with execution ID, status, and timeline events
     */
    public TraceResponseDto executeTrace(TraceRequestDto requestDto) {
        String executionId = UUID.randomUUID().toString();
        Path workspaceDir = null;

        try {
            workspaceDir = storageService.createWorkspace(executionId);
            Path sourceFile = storageService.saveSourceFile(workspaceDir, requestDto.className(), requestDto.sourceCode());

            TraceRequest request = TraceRequest.builder()
                .sourceFile(sourceFile)
                .className(requestDto.className())
                .outputDirectory(workspaceDir)
                .timeoutSeconds(backendProperties.getTimeoutSeconds())
                .stepLimit(backendProperties.getStepLimit())
                .build();

            TraceResult result = traceEngine.execute(request);

            ExecutionTrace trace = new JacksonTraceLoader().load(result.traceFile());

            return new TraceResponseDto(
                executionId,
                "SUCCESS",
                trace.events()
            );
        } catch (PlaybackException | RuntimeException e) {
            log.error("Failed handling temporary source files or reading trace output", e);
            throw new TraceEngineException("Failed handling trace execution files: " + e.getMessage(), e);
        } finally {
            if (workspaceDir != null) {
                storageService.cleanupWorkspace(workspaceDir);
            }
        }
    }

    /**
     * Delegates trace compilation, execution, and capture requests to the underlying TraceEngine.
     *
     * @param request config request parameters
     * @return result details
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
}
