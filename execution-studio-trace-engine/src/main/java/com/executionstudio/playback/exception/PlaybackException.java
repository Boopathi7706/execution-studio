package com.executionstudio.playback.exception;

/**
 * Base exception for all playback engine errors.
 */
public class PlaybackException extends Exception {
    public PlaybackException(String message) {
        super(message);
    }

    public PlaybackException(String message, Throwable cause) {
        super(message, cause);
    }
}
