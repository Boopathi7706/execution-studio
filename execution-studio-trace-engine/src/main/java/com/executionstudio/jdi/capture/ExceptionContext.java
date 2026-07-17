package com.executionstudio.jdi.capture;

import com.sun.jdi.Location;
import com.sun.jdi.ObjectReference;
import com.sun.jdi.ThreadReference;

/**
 * Context wrapper for a JDI ExceptionEvent, passed from the event loop to the capture strategy.
 *
 * <p>Contains the JDI thread reference, location, and exception object reference.
 * Only used within the {@code jdi.capture} package.</p>
 *
 * @param thread    the thread where the exception occurred
 * @param location  the source location of the exception
 * @param exception the exception object reference
 */
public record ExceptionContext(
    ThreadReference thread,
    Location location,
    ObjectReference exception
) {}
