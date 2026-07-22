package com.executionstudio.backend.service;

import com.executionstudio.api.TraceEngine;
import com.executionstudio.api.TraceRequest;
import com.executionstudio.api.TraceResult;
import com.executionstudio.backend.config.BackendProperties;
import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.exception.ResourceNotFoundException;
import com.executionstudio.backend.model.ExecutionSession;
import com.executionstudio.backend.model.ExecutionStatus;
import com.executionstudio.playback.loader.JacksonTraceLoader;
import com.executionstudio.trace.model.ExecutionTrace;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Manages asynchronous execution sessions and background trace engine workers.
 */
@Service
public class ExecutionManager {

    private static final Logger log = LoggerFactory.getLogger(ExecutionManager.class);

    private final TraceEngine traceEngine;
    private final BackendProperties backendProperties;
    private final StorageService storageService;
    private final Map<String, ExecutionSession> sessions = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    @Autowired
    public ExecutionManager(TraceEngine traceEngine, BackendProperties backendProperties, StorageService storageService) {
        this.traceEngine = Objects.requireNonNull(traceEngine, "TraceEngine must not be null");
        this.backendProperties = Objects.requireNonNull(backendProperties, "BackendProperties must not be null");
        this.storageService = Objects.requireNonNull(storageService, "StorageService must not be null");
    }

    /**
     * Submits a trace execution request asynchronously.
     * Returns an ExecutionSession immediately with status QUEUED without blocking HTTP thread.
     *
     * @param requestDto request parameters
     * @return created ExecutionSession
     */
    public ExecutionSession submitTraceRequest(TraceRequestDto requestDto) {
        String executionId = UUID.randomUUID().toString();
        ExecutionSession session = new ExecutionSession(executionId, requestDto.className(), requestDto.sourceCode());
        sessions.put(executionId, session);

        CompletableFuture.runAsync(() -> runTraceExecution(session), executorService);

        log.info("Submitted asynchronous trace request: executionId={}, status=QUEUED", executionId);
        return session;
    }

    private void runTraceExecution(ExecutionSession session) {
        Path workspaceDir = null;
        try {
            workspaceDir = storageService.createWorkspace(session.getExecutionId());
            session.markRunning(workspaceDir);

            Path sourceFile = storageService.saveSourceFile(workspaceDir, session.getClassName(), session.getSourceCode());

            TraceRequest request = TraceRequest.builder()
                .sourceFile(sourceFile)
                .className(session.getClassName())
                .outputDirectory(workspaceDir)
                .timeoutSeconds(backendProperties.getTimeoutSeconds())
                .stepLimit(backendProperties.getStepLimit())
                .build();

            TraceResult result = traceEngine.execute(request);
            ExecutionTrace trace = new JacksonTraceLoader().load(result.traceFile());

            session.markCompleted(trace.events());
            log.info("Asynchronous trace execution completed: executionId={}", session.getExecutionId());
        } catch (Exception e) {
            log.error("Asynchronous trace execution failed for executionId={}", session.getExecutionId(), e);
            session.markFailed(e.getMessage());
        } finally {
            if (workspaceDir != null) {
                storageService.cleanupWorkspace(workspaceDir);
            }
        }
    }

    /**
     * Retrieves an execution session by execution ID.
     *
     * @param executionId execution ID
     * @return ExecutionSession
     */
    public ExecutionSession getSession(String executionId) {
        ExecutionSession session = sessions.get(executionId);
        if (session == null) {
            throw new ResourceNotFoundException("Execution session not found for ID: " + executionId);
        }
        return session;
    }

    /**
     * Returns all active or completed sessions.
     */
    public List<ExecutionSession> getAllSessions() {
        return new ArrayList<>(sessions.values());
    }
}
