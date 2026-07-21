package com.executionstudio.trace.model;

import com.executionstudio.runtime.events.HeapObject;
import com.executionstudio.runtime.events.FrameSnapshot;

import java.util.List;
import java.util.Map;

/**
 * A single serializable event in the execution trace.
 *
 * <p>This is the JSON-level representation of an event, combining fields from
 * both {@code LineEvent} and {@code ExceptionEvent} into a unified structure
 * for straightforward JSON serialization.</p>
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
    String exceptionMessage
) {}
