package com.executionstudio.backend.model;

/**
 * Lifecycle status of an asynchronous trace execution session.
 */
public enum ExecutionStatus {
    QUEUED,
    RUNNING,
    COMPLETED,
    FAILED
}
