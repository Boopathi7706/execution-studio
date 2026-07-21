package com.executionstudio.api;

import java.nio.file.Path;
import java.util.Objects;

/**
 * Encapsulates all inputs required to run a trace execution session.
 * Uses the Builder pattern to allow future extensions (like timeouts, JVM args, breakpoints)
 * without breaking public API compatibility.
 */
public final class TraceRequest {
    private final Path sourceFile;
    private final String className;
    private final Path outputDirectory;

    private TraceRequest(Builder builder) {
        this.sourceFile = Objects.requireNonNull(builder.sourceFile, "sourceFile must not be null");
        this.className = Objects.requireNonNull(builder.className, "className must not be null");
        this.outputDirectory = Objects.requireNonNull(builder.outputDirectory, "outputDirectory must not be null");
    }

    public Path getSourceFile() {
        return sourceFile;
    }

    public String getClassName() {
        return className;
    }

    public Path getOutputDirectory() {
        return outputDirectory;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Path sourceFile;
        private String className;
        private Path outputDirectory;

        public Builder sourceFile(Path sourceFile) {
            this.sourceFile = sourceFile;
            return this;
        }

        public Builder className(String className) {
            this.className = className;
            return this;
        }

        public Builder outputDirectory(Path outputDirectory) {
            this.outputDirectory = outputDirectory;
            return this;
        }

        public TraceRequest build() {
            return new TraceRequest(this);
        }
    }
}
