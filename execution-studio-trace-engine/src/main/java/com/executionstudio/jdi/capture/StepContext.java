package com.executionstudio.jdi.capture;

import com.sun.jdi.Location;
import com.sun.jdi.ThreadReference;

/**
 * Context wrapper for a JDI StepEvent, passed from the event loop to the capture strategy.
 *
 * <p>Contains the JDI thread reference and location. Only used within the
 * {@code jdi.capture} package — no JDI types escape this boundary.</p>
 *
 * @param thread   the thread that generated the step event
 * @param location the source location at the step
 */
public record StepContext(
    ThreadReference thread,
    Location location
) {}
