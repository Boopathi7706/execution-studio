package com.executionstudio.visualization.exception;

/**
 * Exception thrown when a reconstructed visualization model violates semantic consistency constraints.
 */
public class InvalidVisualizationModelException extends VisualizationException {
    public InvalidVisualizationModelException(String message) {
        super(message);
    }

    public InvalidVisualizationModelException(String message, Throwable cause) {
        super(message, cause);
    }
}
