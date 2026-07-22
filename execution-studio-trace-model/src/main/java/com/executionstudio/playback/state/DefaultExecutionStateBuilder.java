package com.executionstudio.playback.state;

import com.executionstudio.runtime.events.FrameSnapshot;
import com.executionstudio.runtime.events.VariableSnapshot;
import com.executionstudio.trace.model.ExecutionTrace;
import com.executionstudio.trace.model.TraceEvent;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Default implementation of {@link ExecutionStateBuilder}.
 */
public class DefaultExecutionStateBuilder implements ExecutionStateBuilder {

    @Override
    public ExecutionState build(ExecutionTrace trace, int eventIndex) {
        if (trace == null) {
            throw new IllegalArgumentException("ExecutionTrace cannot be null");
        }
        if (eventIndex < 0 || eventIndex >= trace.events().size()) {
            throw new IndexOutOfBoundsException(
                String.format("Event index %d is out of bounds for trace size %d", eventIndex, trace.events().size())
            );
        }

        TraceEvent event = trace.events().get(eventIndex);

        // 1. Current Position
        CurrentPosition position = new CurrentPosition(
            event.sourceFile(),
            event.lineNumber()
        );

        // 2. Stack State
        List<FrameState> frameStates = new ArrayList<>();
        if (event.callStack() != null) {
            for (FrameSnapshot frame : event.callStack()) {
                List<VariableState> variables = new ArrayList<>();
                if (frame.locals() != null) {
                    for (VariableSnapshot var : frame.locals()) {
                        variables.add(new VariableState(
                            var.name(),
                            var.declaredType(),
                            var.value()
                        ));
                    }
                }
                frameStates.add(new FrameState(
                    frame.className(),
                    frame.methodName(),
                    frame.lineNumber(),
                    variables
                ));
            }
        }
        StackState stack = new StackState(frameStates);

        // 3. Heap State
        HeapState heap = new HeapState(
            event.heap() != null ? new HashMap<>(event.heap()) : new HashMap<>()
        );

        // 4. Context
        ExecutionStateContext context = new ExecutionStateContext(
            event.className(),
            event.methodName(),
            eventIndex,
            event.exceptionType(),
            event.exceptionMessage()
        );

        return new ExecutionState(position, stack, heap, context);
    }
}
