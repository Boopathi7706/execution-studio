package com.executionstudio.error;

import java.nio.file.Path;

/**
 * Thrown when the trace JSON file cannot be written.
 *
 * <p>Contains the output path that was being written to.</p>
 */
public class SerializationFailure extends TraceEngineException {

    private final Path outputPath;

    public SerializationFailure(String message, Path outputPath, Throwable cause) {
        super(message, cause);
        this.outputPath = outputPath;
    }

    public Path getOutputPath() {
        return outputPath;
    }
}
