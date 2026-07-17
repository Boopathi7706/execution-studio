package com.executionstudio.serializer;

import com.executionstudio.error.SerializationFailure;
import com.executionstudio.trace.model.ExecutionTrace;

import java.nio.file.Path;

/**
 * Serializes an ExecutionTrace to a persistent format.
 *
 * <p><b>Responsibility:</b> Convert an {@link ExecutionTrace} DTO into a file on disk.</p>
 *
 * <p><b>Preconditions:</b></p>
 * <ul>
 *   <li>trace is a complete, non-null ExecutionTrace.</li>
 *   <li>outputFile's parent directory exists and is writable.</li>
 * </ul>
 *
 * <p><b>Postconditions:</b> A valid JSON file exists at outputFile containing the full trace.</p>
 * <p><b>Thread Safety:</b> Implementations must be safe for sequential use.</p>
 * <p><b>Ownership:</b> Reads the trace but does not modify it. Owns the output file
 * handle during serialization.</p>
 * <p><b>Failure Conditions:</b> Throws {@link SerializationFailure} if the file cannot
 * be written or the trace contains non-serializable data.</p>
 */
public interface TraceSerializer {

    /**
     * Serialize the execution trace to the given output file.
     *
     * @param trace      the complete execution trace
     * @param outputFile the output file path
     * @throws SerializationFailure if serialization fails
     */
    void serialize(ExecutionTrace trace, Path outputFile) throws SerializationFailure;
}
