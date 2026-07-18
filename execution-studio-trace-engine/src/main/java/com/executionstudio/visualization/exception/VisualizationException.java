package com.executionstudio.visualization.exception;

/**
 * Base exception for all visualization layer errors.
 */
public class VisualizationException extends Exception {
    public VisualizationException(String message) {
        super(message);
    }

    public VisualizationException(String message, Throwable cause) {
        super(message, cause);
    }
}
