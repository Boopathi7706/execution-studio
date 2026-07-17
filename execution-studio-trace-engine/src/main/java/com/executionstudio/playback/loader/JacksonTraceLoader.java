package com.executionstudio.playback.loader;

import com.executionstudio.playback.exception.InvalidTraceException;
import com.executionstudio.playback.exception.PlaybackException;
import com.executionstudio.playback.validation.TraceValidator;
import com.executionstudio.runtime.events.HeapObject;
import com.executionstudio.runtime.events.HeapValue;
import com.executionstudio.trace.model.ExecutionTrace;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Path;

/**
 * Jackson-based implementation of {@link TraceLoader}.
 */
public class JacksonTraceLoader implements TraceLoader {

    private static final Logger log = LoggerFactory.getLogger(JacksonTraceLoader.class);

    private final ObjectMapper objectMapper;
    private final TraceValidator validator;

    public JacksonTraceLoader() {
        this.objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

        // Register sub-types for polymorphism matching serializer mappings
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

        this.validator = new TraceValidator();
    }

    @Override
    public ExecutionTrace load(Path traceFile) throws PlaybackException {
        log.info("Loading execution trace from {}", traceFile.toAbsolutePath());

        try {
            ExecutionTrace trace = objectMapper.readValue(traceFile.toFile(), ExecutionTrace.class);
            log.debug("Jackson deserialized successfully. Commencing validation...");

            validator.validate(trace);
            log.info("Trace loaded and validated successfully: {} events", trace.events().size());

            return trace;
        } catch (IOException e) {
            throw new InvalidTraceException("Failed to read or parse trace JSON file: " + e.getMessage(), e);
        }
    }
}
