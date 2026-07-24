package com.executionstudio.jdi.capture;

import com.sun.jdi.Location;
import com.sun.jdi.ThreadReference;
import com.sun.jdi.Value;

/**
 * Context payload for a MethodExitEvent captured by JDI.
 */
public record MethodExitContext(
    ThreadReference thread,
    Location location,
    Value returnValue
) {}
