package com.executionstudio.runtime.events;

/**
 * Sealed interface for all runtime events captured during execution.
 *
 * <p><b>Responsibility:</b> Represent a single captured execution event with its
 * sequence number and type discriminator.</p>
 *
 * <p>Designed for future extensibility: new event types (e.g., {@code MethodEnterEvent},
 * {@code MethodExitEvent}, {@code ConsoleOutputEvent}, {@code BreakpointEvent},
 * {@code ThreadStartEvent}, {@code ThreadEndEvent}) can be added by creating a new
 * record and adding it to the {@code permits} clause.</p>
 *
 * <p><b>Thread Safety:</b> All implementations are immutable records.</p>
 */
public sealed interface RuntimeEvent
    permits LineEvent, ExceptionEvent
    // Future: MethodEnterEvent, MethodExitEvent, BreakpointEvent,
    //         ConsoleOutputEvent, ThreadStartEvent, ThreadEndEvent
{
    /**
     * Monotonically increasing sequence number assigned by {@code SequenceGenerator}.
     */
    int seq();

    /**
     * Type discriminator for JSON serialization (e.g., "line", "exception").
     */
    String type();
}
