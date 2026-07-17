package com.executionstudio.config;

import java.nio.file.Path;

/**
 * Centralized configuration for the Trace Engine.
 *
 * <p>All tuneable parameters are defined here with sensible defaults.
 * CLI arguments override defaults. No external config files for this spike.</p>
 *
 * <p>This class uses the builder pattern for clean construction from CLI args.</p>
 */
public class EngineConfig {

    // --- Watchdog ---
    private final int stepLimit;
    private final int timeoutSeconds;

    // --- Object traversal ---
    private final int objectTraversalDepth;
    private final int arrayCaptureLimit;
    private final int maxObjectCount;

    // --- Paths ---
    private final Path sourceFile;
    private final Path outputFile;

    // --- Logging ---
    private final String logLevel;

    // --- Tool metadata ---
    private final String toolVersion;

    private EngineConfig(Builder builder) {
        this.stepLimit = builder.stepLimit;
        this.timeoutSeconds = builder.timeoutSeconds;
        this.objectTraversalDepth = builder.objectTraversalDepth;
        this.arrayCaptureLimit = builder.arrayCaptureLimit;
        this.maxObjectCount = builder.maxObjectCount;
        this.sourceFile = builder.sourceFile;
        this.outputFile = builder.outputFile;
        this.logLevel = builder.logLevel;
        this.toolVersion = builder.toolVersion;
    }

    public int getStepLimit() {
        return stepLimit;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public int getObjectTraversalDepth() {
        return objectTraversalDepth;
    }

    public int getArrayCaptureLimit() {
        return arrayCaptureLimit;
    }

    public int getMaxObjectCount() {
        return maxObjectCount;
    }

    public Path getSourceFile() {
        return sourceFile;
    }

    public Path getOutputFile() {
        return outputFile;
    }

    public String getLogLevel() {
        return logLevel;
    }

    public String getToolVersion() {
        return toolVersion;
    }

    /**
     * Creates a new builder with all default values pre-populated.
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int stepLimit = 50_000;
        private int timeoutSeconds = 10;
        private int objectTraversalDepth = 3;
        private int arrayCaptureLimit = 100;
        private int maxObjectCount = 1000;
        private Path sourceFile;
        private Path outputFile;
        private String logLevel = "INFO";
        private String toolVersion = "0.1.0";

        public Builder stepLimit(int stepLimit) {
            this.stepLimit = stepLimit;
            return this;
        }

        public Builder timeoutSeconds(int timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
            return this;
        }

        public Builder objectTraversalDepth(int objectTraversalDepth) {
            this.objectTraversalDepth = objectTraversalDepth;
            return this;
        }

        public Builder arrayCaptureLimit(int arrayCaptureLimit) {
            this.arrayCaptureLimit = arrayCaptureLimit;
            return this;
        }

        public Builder maxObjectCount(int maxObjectCount) {
            this.maxObjectCount = maxObjectCount;
            return this;
        }

        public Builder sourceFile(Path sourceFile) {
            this.sourceFile = sourceFile;
            return this;
        }

        public Builder outputFile(Path outputFile) {
            this.outputFile = outputFile;
            return this;
        }

        public Builder logLevel(String logLevel) {
            this.logLevel = logLevel;
            return this;
        }

        public Builder toolVersion(String toolVersion) {
            this.toolVersion = toolVersion;
            return this;
        }

        public EngineConfig build() {
            if (sourceFile == null) {
                throw new IllegalArgumentException("sourceFile is required");
            }
            if (outputFile == null) {
                throw new IllegalArgumentException("outputFile is required");
            }
            return new EngineConfig(this);
        }
    }
}
