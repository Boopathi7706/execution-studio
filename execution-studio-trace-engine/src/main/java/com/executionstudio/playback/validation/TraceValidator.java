package com.executionstudio.playback.validation;

import com.executionstudio.playback.exception.InvalidTraceException;
import com.executionstudio.runtime.events.*;
import com.executionstudio.trace.model.*;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Semantic validator for execution traces.
 *
 * <p>Validates schema versions, metadata completeness, event ordering,
 * sequence monotonicity, reference consistency, and boundary constraints.</p>
 */
public class TraceValidator {

    private static final String SUPPORTED_SCHEMA_VERSION = "1.0.0";
    private static final int MAX_REASONABLE_STACK_DEPTH = 5000;

    /**
     * Semantically validate an execution trace.
     *
     * @param trace the execution trace to validate
     * @throws InvalidTraceException if the trace fails validation checks
     */
    public void validate(ExecutionTrace trace) throws InvalidTraceException {
        if (trace == null) {
            throw new InvalidTraceException("Execution trace is null");
        }

        // 1. Schema Version Check
        if (trace.schemaVersion() == null) {
            throw new InvalidTraceException("Trace schemaVersion is missing");
        }
        if (!SUPPORTED_SCHEMA_VERSION.equals(trace.schemaVersion())) {
            throw new InvalidTraceException(
                String.format("Unsupported trace schemaVersion '%s'. Expected '%s'",
                    trace.schemaVersion(), SUPPORTED_SCHEMA_VERSION)
            );
        }

        // 2. Metadata validation
        validateMetadata(trace.metadata());

        // 3. Events List validation
        List<TraceEvent> events = trace.events();
        if (events == null) {
            throw new InvalidTraceException("Trace events list is missing");
        }

        int lastSeq = -1;
        Set<Integer> seqNumbers = new HashSet<>();

        for (int i = 0; i < events.size(); i++) {
            TraceEvent event = events.get(i);
            if (event == null) {
                throw new InvalidTraceException("Trace contains a null event at index " + i);
            }

            // Monotonic & Duplicate Sequence check
            if (event.seq() < 0) {
                throw new InvalidTraceException(
                    String.format("Event at index %d has a negative sequence number: %d", i, event.seq())
                );
            }
            if (seqNumbers.contains(event.seq())) {
                throw new InvalidTraceException(
                    String.format("Duplicate sequence number detected: %d at index %d", event.seq(), i)
                );
            }
            if (event.seq() <= lastSeq) {
                throw new InvalidTraceException(
                    String.format("Non-monotonic sequence number detected at index %d: event seq %d is <= previous seq %d",
                        i, event.seq(), lastSeq)
                );
            }

            seqNumbers.add(event.seq());
            lastSeq = event.seq();

            // Event Structural validation
            validateEvent(event, i);
        }
    }

    private void validateMetadata(TraceMetadata meta) throws InvalidTraceException {
        if (meta == null) {
            throw new InvalidTraceException("Trace metadata is missing");
        }
        if (meta.generatedAt() == null) {
            throw new InvalidTraceException("Trace metadata generatedAt timestamp is missing");
        }
        if (meta.toolVersion() == null || meta.toolVersion().isBlank()) {
            throw new InvalidTraceException("Trace metadata toolVersion is missing or empty");
        }
        if (meta.sourceFile() == null || meta.sourceFile().isBlank()) {
            throw new InvalidTraceException("Trace metadata sourceFile is missing or empty");
        }
        if (meta.mainClass() == null || meta.mainClass().isBlank()) {
            throw new InvalidTraceException("Trace metadata mainClass is missing or empty");
        }
        if (meta.executionDurationMs() < 0) {
            throw new InvalidTraceException(
                "Trace metadata has invalid executionDurationMs: " + meta.executionDurationMs()
            );
        }
        if (meta.terminationReason() == null || meta.terminationReason().isBlank()) {
            throw new InvalidTraceException("Trace metadata terminationReason is missing or empty");
        }
    }

    private void validateEvent(TraceEvent event, int index) throws InvalidTraceException {
        if (event.type() == null || event.type().isBlank()) {
            throw new InvalidTraceException("Event type is missing at index " + index);
        }
        if (!"line".equals(event.type()) && !"exception".equals(event.type())) {
            throw new InvalidTraceException(
                String.format("Unknown event type '%s' at index %d", event.type(), index)
            );
        }
        if (event.sourceFile() == null || event.sourceFile().isBlank()) {
            throw new InvalidTraceException("Event sourceFile is missing at index " + index);
        }
        if (event.className() == null || event.className().isBlank()) {
            throw new InvalidTraceException("Event className is missing at index " + index);
        }
        if (event.methodName() == null || event.methodName().isBlank()) {
            throw new InvalidTraceException("Event methodName is missing at index " + index);
        }
        if (event.lineNumber() < -1) {
            throw new InvalidTraceException(
                String.format("Event has invalid line number %d at index %d", event.lineNumber(), index)
            );
        }

        // Stack Depth Validation
        List<FrameSnapshot> callStack = event.callStack();
        if (callStack == null) {
            throw new InvalidTraceException("Event callStack is null at index " + index);
        }
        if (callStack.size() > MAX_REASONABLE_STACK_DEPTH) {
            throw new InvalidTraceException(
                String.format("Event callStack depth %d exceeds reasonable limit %d at index %d",
                    callStack.size(), MAX_REASONABLE_STACK_DEPTH, index)
            );
        }

        // Heap Validation
        Map<String, HeapObject> heap = event.heap();
        if (heap == null) {
            throw new InvalidTraceException("Event heap is null at index " + index);
        }
        validateHeapObjects(heap, index);

        // Frame and Local Variable Reference Validation
        Set<String> collectedRefs = new HashSet<>();
        for (int f = 0; f < callStack.size(); f++) {
            FrameSnapshot frame = callStack.get(f);
            validateFrame(frame, index, f, collectedRefs);
        }

        // Verify that all collected object/array refs map to valid heap records
        for (String refId : collectedRefs) {
            if (!heap.containsKey(refId)) {
                throw new InvalidTraceException(
                    String.format("Corrupted heap reference: object ID '%s' referenced in stack frames is missing from the event heap at index %d",
                        refId, index)
                );
            }
        }
    }

    private void validateHeapObjects(Map<String, HeapObject> heap, int eventIndex) throws InvalidTraceException {
        for (Map.Entry<String, HeapObject> entry : heap.entrySet()) {
            String objectId = entry.getKey();
            HeapObject obj = entry.getValue();

            if (objectId == null || objectId.isBlank()) {
                throw new InvalidTraceException("Heap map contains an empty or null object ID at event index " + eventIndex);
            }
            if (obj == null) {
                throw new InvalidTraceException(
                    String.format("Heap contains a null object snapshot for ID '%s' at event index %d", objectId, eventIndex)
                );
            }

            // Heap object validation
            switch (obj) {
                case HeapObject.ObjectSnapshot snapshot -> {
                    if (snapshot.className() == null || snapshot.className().isBlank()) {
                        throw new InvalidTraceException(
                            String.format("Heap object '%s' has null or empty className at event index %d", objectId, eventIndex)
                        );
                    }
                    if (snapshot.fields() == null) {
                        throw new InvalidTraceException(
                            String.format("Heap object '%s' has null fields map at event index %d", objectId, eventIndex)
                        );
                    }
                }
                case HeapObject.ArraySnapshot arraySnapshot -> {
                    if (arraySnapshot.elementType() == null || arraySnapshot.elementType().isBlank()) {
                        throw new InvalidTraceException(
                            String.format("Heap array '%s' has null or empty elementType at event index %d", objectId, eventIndex)
                        );
                    }
                    if (arraySnapshot.length() < 0) {
                        throw new InvalidTraceException(
                            String.format("Heap array '%s' has negative length %d at event index %d",
                                objectId, arraySnapshot.length(), eventIndex)
                        );
                    }
                    if (arraySnapshot.elements() == null) {
                        throw new InvalidTraceException(
                            String.format("Heap array '%s' has null elements list at event index %d", objectId, eventIndex)
                        );
                    }
                    if (arraySnapshot.elements().size() > arraySnapshot.length()) {
                        throw new InvalidTraceException(
                            String.format("Heap array '%s' has element size %d exceeding declared length %d at event index %d",
                                objectId, arraySnapshot.elements().size(), arraySnapshot.length(), eventIndex)
                        );
                    }
                }
            }
        }
    }

    private void validateFrame(FrameSnapshot frame, int eventIndex, int frameIndex, Set<String> collectedRefs)
            throws InvalidTraceException {
        if (frame.className() == null || frame.className().isBlank()) {
            throw new InvalidTraceException(
                String.format("Stack frame %d at event %d has null or empty className", frameIndex, eventIndex)
            );
        }
        if (frame.methodName() == null || frame.methodName().isBlank()) {
            throw new InvalidTraceException(
                String.format("Stack frame %d at event %d has null or empty methodName", frameIndex, eventIndex)
            );
        }
        if (frame.lineNumber() < -1) {
            throw new InvalidTraceException(
                String.format("Stack frame %d at event %d has invalid lineNumber: %d",
                    frameIndex, eventIndex, frame.lineNumber())
            );
        }

        List<VariableSnapshot> locals = frame.locals();
        if (locals == null) {
            throw new InvalidTraceException(
                String.format("Stack frame %d at event %d has null locals list", frameIndex, eventIndex)
            );
        }

        for (int v = 0; v < locals.size(); v++) {
            VariableSnapshot var = locals.get(v);
            if (var == null) {
                throw new InvalidTraceException(
                    String.format("Stack frame %d at event %d contains a null local variable at index %d",
                        frameIndex, eventIndex, v)
                );
            }
            if (var.name() == null || var.name().isBlank()) {
                throw new InvalidTraceException(
                    String.format("Variable at index %d of frame %d in event %d has null or empty name",
                        v, frameIndex, eventIndex)
                );
            }
            if (var.declaredType() == null || var.declaredType().isBlank()) {
                throw new InvalidTraceException(
                    String.format("Variable '%s' of frame %d in event %d has null or empty declaredType",
                        var.name(), frameIndex, eventIndex)
                );
            }
            if (var.value() == null) {
                throw new InvalidTraceException(
                    String.format("Variable '%s' of frame %d in event %d has null value structure",
                        var.name(), frameIndex, eventIndex)
                );
            }

            collectReferences(var.value(), collectedRefs);
        }
    }

    private void collectReferences(HeapValue val, Set<String> refs) {
        if (val instanceof HeapValue.ObjectRefValue ref) {
            refs.add(ref.objectId());
        } else if (val instanceof HeapValue.ArrayRefValue ref) {
            refs.add(ref.objectId());
        }
        // Note: StringValue has an objectId but is serialized inline,
        // so its data is not stored in the heap map. We do not validate string references.
    }
}
