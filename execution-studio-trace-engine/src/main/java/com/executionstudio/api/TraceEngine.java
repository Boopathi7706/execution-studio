package com.executionstudio.api;

/**
 * Reusable execution tracing library service interface.
 * Orchestrates compiling, debug launching, step capturing, and trace serialization.
 */
public interface TraceEngine {

    /**
     * Executes the target Java source program under trace capture.
     *
     * @param request the execution request configuration
     * @return the result of trace capture execution
     * @throws TraceEngineException if compile or execution capture fails
     */
    TraceResult execute(TraceRequest request) throws TraceEngineException;
}
