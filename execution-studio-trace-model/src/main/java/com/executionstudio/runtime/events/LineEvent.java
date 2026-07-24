package com.executionstudio.runtime.events;

import java.util.List;
import java.util.Map;

/**
 * A line-level execution event captured at a specific source line.
 */
public record LineEvent(
    int seq,
    String sourceFile,
    String className,
    String methodName,
    int lineNumber,
    List<FrameSnapshot> callStack,
    Map<String, HeapObject> heap,
    List<OutputLogEntry> outputEvents,
    HeapValue returnValue
) implements RuntimeEvent {

    public LineEvent(
        int seq,
        String sourceFile,
        String className,
        String methodName,
        int lineNumber,
        List<FrameSnapshot> callStack,
        Map<String, HeapObject> heap
    ) {
        this(seq, sourceFile, className, methodName, lineNumber, callStack, heap, List.of(), null);
    }

    @Override
    public String type() {
        return "line";
    }
}
