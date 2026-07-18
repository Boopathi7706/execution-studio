package com.executionstudio.pipeline.validation;

import java.util.ArrayList;
import java.util.List;

/**
 * Report containing validation metrics and error diagnostics.
 */
public class ValidationReport {
    private final String programName;
    private boolean compilationSuccess = false;
    private boolean traceGenerationSuccess = false;
    private int eventCount = 0;
    private long traceFileSize = 0;
    private boolean playbackSuccess = false;
    private int playbackStepsVerified = 0;
    private boolean mappingSuccess = false;
    private boolean validationSuccess = true;
    private final List<String> errors = new ArrayList<>();

    public ValidationReport(String programName) {
        this.programName = programName;
    }

    public void addError(String stage, String detail) {
        this.validationSuccess = false;
        this.errors.add(String.format("[%s] %s", stage, detail));
    }

    public String getProgramName() {
        return programName;
    }

    public boolean isCompilationSuccess() {
        return compilationSuccess;
    }

    public void setCompilationSuccess(boolean compilationSuccess) {
        this.compilationSuccess = compilationSuccess;
    }

    public boolean isTraceGenerationSuccess() {
        return traceGenerationSuccess;
    }

    public void setTraceGenerationSuccess(boolean traceGenerationSuccess) {
        this.traceGenerationSuccess = traceGenerationSuccess;
    }

    public int getEventCount() {
        return eventCount;
    }

    public void setEventCount(int eventCount) {
        this.eventCount = eventCount;
    }

    public long getTraceFileSize() {
        return traceFileSize;
    }

    public void setTraceFileSize(long traceFileSize) {
        this.traceFileSize = traceFileSize;
    }

    public boolean isPlaybackSuccess() {
        return playbackSuccess;
    }

    public void setPlaybackSuccess(boolean playbackSuccess) {
        this.playbackSuccess = playbackSuccess;
    }

    public int getPlaybackStepsVerified() {
        return playbackStepsVerified;
    }

    public void setPlaybackStepsVerified(int playbackStepsVerified) {
        this.playbackStepsVerified = playbackStepsVerified;
    }

    public boolean isMappingSuccess() {
        return mappingSuccess;
    }

    public void setMappingSuccess(boolean mappingSuccess) {
        this.mappingSuccess = mappingSuccess;
    }

    public boolean isValidationSuccess() {
        return validationSuccess;
    }

    public void setValidationSuccess(boolean validationSuccess) {
        this.validationSuccess = validationSuccess;
    }

    public List<String> getErrors() {
        return errors;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("--------------------------------------------------------------------------------\n");
        sb.append(String.format("VALIDATION REPORT FOR: %s\n", programName));
        sb.append("--------------------------------------------------------------------------------\n");
        sb.append(String.format("  Compilation:       %s\n", compilationSuccess ? "SUCCESS" : "FAILED"));
        sb.append(String.format("  Trace Gen:         %s\n", traceGenerationSuccess ? "SUCCESS" : "FAILED"));
        sb.append(String.format("  Trace File Size:   %d bytes\n", traceFileSize));
        sb.append(String.format("  Playback Init:     %s\n", playbackSuccess ? "SUCCESS" : "FAILED"));
        sb.append(String.format("  Steps Replayed:    %d / %d\n", playbackStepsVerified, eventCount));
        sb.append(String.format("  Visual Mapping:    %s\n", mappingSuccess ? "SUCCESS" : "FAILED"));
        sb.append(String.format("  Semantic Valid:    %s\n", validationSuccess ? "PASSED" : "FAILED"));

        if (!errors.isEmpty()) {
            sb.append("  Errors/Warnings:\n");
            for (String err : errors) {
                sb.append("    - ").append(err).append("\n");
            }
        }
        sb.append("--------------------------------------------------------------------------------\n");
        return sb.toString();
    }
}
