package com.executionstudio.backend.service;

import com.executionstudio.api.TraceEngine;
import com.executionstudio.api.TraceRequest;
import com.executionstudio.api.TraceResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * Service orchestrating execution and tracing tasks using standard Spring bean delegation.
 */
@Service
public class TraceExecutionService {

    private final TraceEngine traceEngine;

    @Autowired
    public TraceExecutionService(TraceEngine traceEngine) {
        this.traceEngine = Objects.requireNonNull(traceEngine, "TraceEngine must not be null");
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
}
