package com.executionstudio.runtime.events;

/**
 * A single console stdout or stderr output entry emitted during program execution.
 *
 * @param type      "stdout" or "stderr"
 * @param text      the text content of the output line
 * @param timestamp epoch millisecond timestamp
 */
public record OutputLogEntry(
    String type,
    String text,
    long timestamp
) {}
