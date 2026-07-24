package com.executionstudio.runtime.events;

import java.util.List;
import java.util.Map;

/**
 * An exception event captured when an uncaught exception terminates execution.
 */
public record ExceptionEvent(
    int seq,
    String sourceFile,
    String className,
    String methodName,
    int lineNumber,
    String exceptionType,
    String exceptionMessage,
    List<FrameSnapshot> callStack,
    Map<String, HeapObject> heap,
    List<OutputLogEntry> outputEvents
) implements RuntimeEvent {

    public ExceptionEvent(
        int seq,
        String sourceFile,
        String className,
        String methodName,
        int lineNumber,
        String exceptionType,
        String exceptionMessage,
        List<FrameSnapshot> callStack,
        Map<String, HeapObject> heap
    ) {
        this(seq, sourceFile, className, methodName, lineNumber, exceptionType, exceptionMessage, callStack, heap, List.of());
    }

    @Override
    public String type() {
        return "exception";
    }
}
