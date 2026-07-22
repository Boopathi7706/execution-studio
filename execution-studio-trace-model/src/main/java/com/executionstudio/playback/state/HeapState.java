package com.executionstudio.playback.state;

import com.executionstudio.runtime.events.HeapObject;
import java.util.Map;

/**
 * Immutable state of the heap objects referenced from the stack.
 *
 * @param objects map of synthetic object ID to object/array snapshots
 */
public record HeapState(
    Map<String, HeapObject> objects
) {}
