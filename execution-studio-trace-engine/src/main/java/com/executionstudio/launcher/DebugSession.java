package com.executionstudio.launcher;

import com.executionstudio.jdi.capture.CaptureStrategy;
import com.executionstudio.watchdog.Watchdog;

/**
 * A connected debug session with a running (suspended) debuggee JVM.
 *
 * <p><b>Responsibility:</b> Drive the JDI event loop, dispatching events to a
 * {@link CaptureStrategy}, and respecting the {@link Watchdog}'s termination limits.</p>
 *
 * <p><b>Preconditions:</b></p>
 * <ul>
 *   <li>The session is connected to a live, suspended debuggee VM.</li>
 *   <li>strategy and watchdog are non-null and initialized.</li>
 * </ul>
 *
 * <p><b>Postconditions:</b></p>
 * <ul>
 *   <li>After run() returns, the debuggee VM has exited (normally, by exception,
 *       or by watchdog termination).</li>
 *   <li>All JDI events have been dispatched to the strategy before run() returns.</li>
 * </ul>
 *
 * <p><b>Thread Safety:</b> run() must be called from a single thread. terminate() may be
 * called from any thread.</p>
 * <p><b>Ownership:</b> The session owns the VirtualMachine connection. close() terminates
 * the debuggee if still running.</p>
 * <p><b>Failure Conditions:</b> Throws RuntimeException if the connection is lost
 * unexpectedly during execution.</p>
 */
public interface DebugSession extends AutoCloseable {

    /**
     * Run the debug session, dispatching JDI events to the given strategy.
     * Blocks until the VM exits, an uncaught exception occurs, or the watchdog triggers.
     */
    void run(CaptureStrategy strategy, Watchdog watchdog);

    /**
     * Forcibly terminate the debuggee VM.
     */
    void terminate();

    /**
     * Returns the termination reason after run() completes.
     */
    String getTerminationReason();
}
