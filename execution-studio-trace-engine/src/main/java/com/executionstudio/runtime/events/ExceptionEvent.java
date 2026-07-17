package com.executionstudio.runtime.events;

import java.util.List;
import java.util.Map;

/**
 * An exception event captured when an uncaught exception terminates execution.
 *
 * @param seq              monotonically increasing sequence number
 * @param sourceFile       the source file name
 * @param className        the class where the exception occurred
 * @param methodName       the method where the exception occurred
 * @param lineNumber       the line where the exception occurred
 * @param exceptionType    the fully qualified exception class name
 * @param exceptionMessage the exception message (may be null)
 * @param callStack        the call stack at the point of the exception
 * @param heap             heap snapshot at the point of the exception
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
    Map<String, HeapObject> heap
) implements RuntimeEvent {

    @Override
    public String type() {
        return "exception";
    }
}
