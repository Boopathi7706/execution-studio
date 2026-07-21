package com.executionstudio.playback.state;

/**
 * Represents the current position in the source code.
 *
 * @param sourceFile name of the source file
 * @param lineNumber 1-based source line number
 */
public record CurrentPosition(
    String sourceFile,
    int lineNumber
) {}
