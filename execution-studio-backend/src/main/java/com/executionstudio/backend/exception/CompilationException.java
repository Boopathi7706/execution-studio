package com.executionstudio.backend.exception;

import java.util.List;

public class CompilationException extends RuntimeException {
    private final List<String> diagnostics;

    public CompilationException(String message) {
        super(message);
        this.diagnostics = List.of();
    }

    public CompilationException(String message, List<String> diagnostics) {
        super(message);
        this.diagnostics = diagnostics != null ? List.copyOf(diagnostics) : List.of();
    }

    public List<String> getDiagnostics() {
        return diagnostics;
    }
}
