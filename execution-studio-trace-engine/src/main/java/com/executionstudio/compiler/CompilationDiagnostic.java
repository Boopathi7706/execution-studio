package com.executionstudio.compiler;

/**
 * Structured diagnostic information captured during Java source compilation.
 */
public record CompilationDiagnostic(
    String severity,
    String file,
    long line,
    long column,
    String message
) {}
