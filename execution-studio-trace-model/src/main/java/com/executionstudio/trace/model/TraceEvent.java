package com.executionstudio.trace.model;

import com.executionstudio.runtime.events.FrameSnapshot;
import com.executionstudio.runtime.events.HeapObject;
import com.executionstudio.runtime.events.HeapValue;
import com.executionstudio.runtime.events.OutputLogEntry;

import java.util.List;
import java.util.Map;

/**
 * A single serializable event in the execution trace.
 *
 * @param seq              sequence number
 * @param type             event type ("line" or "exception")
 * @param sourceFile       source file name
 * @param className        declaring class name
 * @param methodName       method name
 * @param lineNumber       source line number
 * @param callStack        full call stack
 * @param heap             heap snapshot for this event
 * @param exceptionType    exception class name (null for line events)
 * @param exceptionMessage exception message (null for line events)
 * @param outputEvents     stdout/stderr entries captured up to or during this step
 * @param returnValue      method return value if this step represents a method return
 */
public record TraceEvent(
    int seq,
    String type,
    String sourceFile,
    String className,
    String methodName,
    int lineNumber,
    List<FrameSnapshot> callStack,
    Map<String, HeapObject> heap,
    String exceptionType,
    String exceptionMessage,
    List<OutputLogEntry> outputEvents,
    HeapValue returnValue
) {
    public TraceEvent(
        int seq,
        String type,
        String sourceFile,
        String className,
        String methodName,
        int lineNumber,
        List<FrameSnapshot> callStack,
        Map<String, HeapObject> heap,
        String exceptionType,
        String exceptionMessage
    ) {
        this(seq, type, sourceFile, className, methodName, lineNumber, callStack, heap, exceptionType, exceptionMessage, List.of(), null);
    }
}
