package com.executionstudio.serializer;

import com.executionstudio.error.SerializationFailure;
import com.executionstudio.runtime.events.HeapObject;
import com.executionstudio.runtime.events.HeapValue;
import com.executionstudio.trace.model.ExecutionTrace;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Jackson-based JSON serializer for {@link ExecutionTrace}.
 *
 * <p>Produces pretty-printed, human-readable JSON with null fields omitted
 * for cleaner output (e.g., exception fields in line events).</p>
 */
public class JacksonTraceSerializer implements TraceSerializer {

    private static final Logger log = LoggerFactory.getLogger(JacksonTraceSerializer.class);

    private final ObjectMapper objectMapper;

    public JacksonTraceSerializer() {
        this.objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .enable(SerializationFeature.INDENT_OUTPUT)
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

        // Register mixins or subtypes if needed for polymorphic serialization
        objectMapper.registerSubtypes(
            HeapValue.IntValue.class,
            HeapValue.LongValue.class,
            HeapValue.FloatValue.class,
            HeapValue.DoubleValue.class,
            HeapValue.BooleanValue.class,
            HeapValue.CharValue.class,
            HeapValue.StringValue.class,
            HeapValue.NullValue.class,
            HeapValue.ObjectRefValue.class,
            HeapValue.ArrayRefValue.class,
            HeapObject.ObjectSnapshot.class,
            HeapObject.ArraySnapshot.class
        );
    }

    @Override
    public void serialize(ExecutionTrace trace, Path outputFile) throws SerializationFailure {
        log.info("Serializing trace to {}", outputFile);

        try {
            // Ensure parent directory exists
            Path parent = outputFile.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }

            objectMapper.writeValue(outputFile.toFile(), trace);

            long fileSize = Files.size(outputFile);
            log.info("Trace written: {} ({} bytes, {} events)",
                outputFile, fileSize, trace.events().size());

        } catch (IOException e) {
            throw new SerializationFailure(
                "Failed to write trace to " + outputFile + ": " + e.getMessage(),
                outputFile, e);
        }
    }
}
