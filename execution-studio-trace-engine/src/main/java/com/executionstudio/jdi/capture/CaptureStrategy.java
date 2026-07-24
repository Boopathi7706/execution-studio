package com.executionstudio.jdi.capture;

/**
 * Strategy for processing JDI debug events and producing RuntimeEvents.
 *
 * <p><b>Responsibility:</b> Receive raw JDI event notifications, extract execution state
 * (stack frames, variables, object graphs), and emit RuntimeEvents to the TraceBuilder.</p>
 *
 * <p><b>Preconditions:</b></p>
 * <ul>
 *   <li>Called only while the debuggee thread is suspended (JDI constraint).</li>
 *   <li>The ExecutionContext is fully initialized.</li>
 * </ul>
 *
 * <p><b>Postconditions:</b></p>
 * <ul>
 *   <li>After each {@code on*()} call, any produced RuntimeEvents have been added
 *       to the TraceBuilder via the ExecutionContext.</li>
 *   <li>All JDI types have been translated to DTOs before returning.</li>
 * </ul>
 *
 * <p><b>Thread Safety:</b> Not thread-safe. Called sequentially from the JDI event loop thread.</p>
 * <p><b>Ownership:</b> The strategy reads JDI state but does not own it. It owns the
 * RuntimeEvent DTOs it produces.</p>
 * <p><b>Failure Conditions:</b> May throw RuntimeException if JDI state is inaccessible
 * (e.g., InvalidStackFrameException). The DebugSession catches and handles these.</p>
 */
public interface CaptureStrategy {

    /**
     * Called on each StepEvent. Extracts state from JDI and produces a RuntimeEvent.
     */
    void onStep(StepContext ctx);

    /**
     * Called when an uncaught exception is detected.
     */
    void onException(ExceptionContext ctx);

    /**
     * Called when the VM exits normally.
     */
    void onVMDeath();

    /**
     * Called on MethodExitEvent when a method returns a value.
     */
    default void onMethodExit(MethodExitContext ctx) {}

    /**
     * Called when a stdout or stderr log line is captured.
     */
    default void onOutput(com.executionstudio.runtime.events.OutputLogEntry entry) {}
}
