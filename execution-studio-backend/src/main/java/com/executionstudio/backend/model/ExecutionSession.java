package com.executionstudio.backend.model;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Objects;

/**
 * Represents the state and result of an asynchronous trace execution session.
 */
public class ExecutionSession {

    private final String executionId;
    private final String className;
    private final String sourceCode;
    private final Instant createdAt;

    private volatile ExecutionStatus status;
    private volatile Instant startedAt;
    private volatile Instant completedAt;
    private volatile Object timeline;
    private volatile String errorMessage;
    private volatile Path workspaceDir;

    public ExecutionSession(String executionId, String className, String sourceCode) {
        this.executionId = Objects.requireNonNull(executionId, "executionId must not be null");
        this.className = Objects.requireNonNull(className, "className must not be null");
        this.sourceCode = Objects.requireNonNull(sourceCode, "sourceCode must not be null");
        this.status = ExecutionStatus.QUEUED;
        this.createdAt = Instant.now();
    }

    public String getExecutionId() {
        return executionId;
    }

    public String getClassName() {
        return className;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(ExecutionStatus status) {
        this.status = status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public Object getTimeline() {
        return timeline;
    }

    public void setTimeline(Object timeline) {
        this.timeline = timeline;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Path getWorkspaceDir() {
        return workspaceDir;
    }

    public void setWorkspaceDir(Path workspaceDir) {
        this.workspaceDir = workspaceDir;
    }

    public void markRunning(Path workspaceDir) {
        this.status = ExecutionStatus.RUNNING;
        this.startedAt = Instant.now();
        this.workspaceDir = workspaceDir;
    }

    public void markCompleted(Object timeline) {
        this.status = ExecutionStatus.COMPLETED;
        this.completedAt = Instant.now();
        this.timeline = timeline;
    }

    public void markFailed(String errorMessage) {
        this.status = ExecutionStatus.FAILED;
        this.completedAt = Instant.now();
        this.errorMessage = errorMessage;
    }
}
