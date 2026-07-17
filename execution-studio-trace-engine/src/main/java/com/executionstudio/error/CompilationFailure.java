package com.executionstudio.error;

import java.util.List;

/**
 * Thrown when the Java source file fails to compile.
 *
 * <p>Contains the compiler diagnostic messages for display to the user.
 * This is thrown only for infrastructure failures (e.g., javac not found);
 * normal compilation errors are reported via {@code CompilationResult.diagnostics()}.</p>
 */
public class CompilationFailure extends TraceEngineException {

    private final List<String> diagnostics;

    public CompilationFailure(String message, List<String> diagnostics) {
        super(message);
        this.diagnostics = List.copyOf(diagnostics);
    }

    public CompilationFailure(String message, Throwable cause) {
        super(message, cause);
        this.diagnostics = List.of();
    }

    public List<String> getDiagnostics() {
        return diagnostics;
    }
}
