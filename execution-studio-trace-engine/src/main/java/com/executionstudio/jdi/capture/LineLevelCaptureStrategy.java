package com.executionstudio.jdi.capture;

import com.executionstudio.context.ExecutionContext;
import com.executionstudio.runtime.events.*;
import com.sun.jdi.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Line-level capture strategy — the core capture logic for Spike 01.
 *
 * <p>On each step event:</p>
 * <ol>
 *   <li>Walks the full call stack</li>
 *   <li>Reads all visible variables in each frame</li>
 *   <li>Traverses object graphs to produce heap snapshots</li>
 *   <li>Produces a {@link LineEvent} with full heap snapshot</li>
 *   <li>Records statistics and adds the event to the TraceBuilder</li>
 * </ol>
 *
 * <p>All JDI → DTO translation happens here. No JDI type escapes this class.</p>
 */
public class LineLevelCaptureStrategy implements CaptureStrategy {

    private static final Logger log = LoggerFactory.getLogger(LineLevelCaptureStrategy.class);

    private final ExecutionContext context;
    private final ObjectGraphTraverser traverser;

    public LineLevelCaptureStrategy(ExecutionContext context, ObjectGraphTraverser traverser) {
        this.context = context;
        this.traverser = traverser;
    }

    @Override
    public void onStep(StepContext ctx) {
        try {
            Location location = ctx.location();
            ThreadReference thread = ctx.thread();

            String sourceFile = getSourceFile(location);
            String className = location.declaringType().name();
            String methodName = location.method().name();
            int lineNumber = location.lineNumber();

            log.trace("Step: {}:{} {}.{}()", sourceFile, lineNumber, className, methodName);

            // Reset traverser for this step
            traverser.reset();

            // Capture full call stack
            Map<String, HeapObject> heapCollector = new LinkedHashMap<>();
            List<FrameSnapshot> callStack = captureCallStack(thread, heapCollector);

            // Record statistics
            int seq = context.getSequenceGenerator().next();
            context.getStatisticsCollector().recordStackDepth(callStack.size());
            context.getStatisticsCollector().recordMethodSeen(className + "." + methodName);
            context.getStatisticsCollector().recordLineVisit(className, lineNumber);

            // Build the event
            LineEvent event = new LineEvent(
                seq, sourceFile, className, methodName, lineNumber,
                callStack, heapCollector
            );

            context.getStatisticsCollector().recordEvent(event);
            context.getTraceBuilder().addEvent(event);

        } catch (IncompatibleThreadStateException e) {
            log.warn("Thread not suspended during capture: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("Failed to capture step: {}", e.getMessage(), e);
        }
    }

    @Override
    public void onException(ExceptionContext ctx) {
        try {
            Location location = ctx.location();
            String sourceFile = getSourceFile(location);
            String className = location.declaringType().name();
            String methodName = location.method().name();
            int lineNumber = location.lineNumber();

            // Get exception details
            ObjectReference exObj = ctx.exception();
            String exceptionType = exObj.referenceType().name();
            String exceptionMessage = getExceptionMessage(exObj);

            log.info("Uncaught exception at {}:{}: {} - {}",
                sourceFile, lineNumber, exceptionType, exceptionMessage);

            // Reset traverser and capture call stack
            traverser.reset();
            Map<String, HeapObject> heapCollector = new LinkedHashMap<>();
            List<FrameSnapshot> callStack;
            try {
                callStack = captureCallStack(ctx.thread(), heapCollector);
            } catch (IncompatibleThreadStateException e) {
                callStack = List.of();
            }

            int seq = context.getSequenceGenerator().next();

            ExceptionEvent event = new ExceptionEvent(
                seq, sourceFile, className, methodName, lineNumber,
                exceptionType, exceptionMessage, callStack, heapCollector
            );

            context.getStatisticsCollector().recordEvent(event);
            context.getTraceBuilder().addEvent(event);

        } catch (Exception e) {
            log.warn("Failed to capture exception event: {}", e.getMessage(), e);
        }
    }

    @Override
    public void onVMDeath() {
        log.info("VM exited normally");
    }

    /**
     * Capture the full call stack with all visible local variables per frame.
     */
    private List<FrameSnapshot> captureCallStack(ThreadReference thread,
                                                   Map<String, HeapObject> heapCollector)
            throws IncompatibleThreadStateException {

        List<StackFrame> frames = thread.frames();
        List<FrameSnapshot> snapshots = new ArrayList<>(frames.size());

        for (StackFrame frame : frames) {
            try {
                Location frameLoc = frame.location();
                String frameClass = frameLoc.declaringType().name();
                String frameMethod = frameLoc.method().name();
                int frameLine = frameLoc.lineNumber();

                List<VariableSnapshot> locals = captureLocals(frame, heapCollector);

                snapshots.add(new FrameSnapshot(frameClass, frameMethod, frameLine, locals));
            } catch (Exception e) {
                log.trace("Could not capture frame: {}", e.getMessage());
            }
        }

        return snapshots;
    }

    /**
     * Capture all visible local variables in a single stack frame.
     */
    private List<VariableSnapshot> captureLocals(StackFrame frame,
                                                   Map<String, HeapObject> heapCollector) {
        try {
            List<LocalVariable> visibleVars = frame.visibleVariables();
            if (visibleVars.isEmpty()) {
                return List.of();
            }

            Map<LocalVariable, Value> values = frame.getValues(visibleVars);
            List<VariableSnapshot> snapshots = new ArrayList<>(visibleVars.size());

            for (LocalVariable var : visibleVars) {
                Value jdiValue = values.get(var);
                String declaredType = var.typeName();
                HeapValue heapValue = traverser.traverse(jdiValue, 0, heapCollector);
                snapshots.add(new VariableSnapshot(var.name(), declaredType, heapValue));
            }

            return snapshots;
        } catch (AbsentInformationException e) {
            // No debug info for this frame (e.g., JDK internal class)
            log.trace("No debug info for frame: {}", e.getMessage());
            return List.of();
        } catch (Exception e) {
            log.trace("Failed to capture locals: {}", e.getMessage());
            return List.of();
        }
    }

    private String getSourceFile(Location location) {
        try {
            return location.sourceName();
        } catch (AbsentInformationException e) {
            return "<unknown>";
        }
    }

    private String getExceptionMessage(ObjectReference exObj) {
        try {
            // Try to read the 'detailMessage' field from Throwable
            Field messageField = exObj.referenceType().fieldByName("detailMessage");
            if (messageField != null) {
                Value msgValue = exObj.getValue(messageField);
                if (msgValue instanceof StringReference strRef) {
                    return strRef.value();
                }
            }
        } catch (Exception e) {
            log.trace("Could not read exception message: {}", e.getMessage());
        }
        return null;
    }
}
