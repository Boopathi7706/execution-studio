package com.executionstudio.runtime.events;

import java.util.List;
import java.util.Map;

/**
 * A line-level execution event captured at a specific source line.
 *
 * <p>Contains the full call stack, all visible local variables per frame,
 * and a complete heap snapshot of all objects referenced from the stack.</p>
 *
 * @param seq        monotonically increasing sequence number
 * @param sourceFile the source file name (e.g., "Sample.java")
 * @param className  the declaring class at the current execution point
 * @param methodName the method name at the current execution point
 * @param lineNumber the source line number
 * @param callStack  full call stack, index 0 = current frame (top of stack)
 * @param heap       all objects reachable from this event's stack frames
 */
public record LineEvent(
    int seq,
    String sourceFile,
    String className,
    String methodName,
    int lineNumber,
    List<FrameSnapshot> callStack,
    Map<String, HeapObject> heap
) implements RuntimeEvent {

    @Override
    public String type() {
        return "line";
    }
}
