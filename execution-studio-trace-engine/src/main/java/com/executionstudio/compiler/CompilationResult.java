package com.executionstudio.compiler;

import java.nio.file.Path;
import java.util.List;

/**
 * Result of a compilation attempt.
 *
 * @param success               true if compilation succeeded with no errors
 * @param mainClassName        the detected main class name (null if not found or compilation failed)
 * @param allClassNames        all class names produced by compilation
 * @param classDir             the directory containing compiled .class files
 * @param diagnostics          compiler diagnostic messages as strings (legacy format)
 * @param structuredDiagnostics compiler diagnostic messages as structured objects
 */
public record CompilationResult(
    boolean success,
    String mainClassName,
    List<String> allClassNames,
    Path classDir,
    List<String> diagnostics,
    List<CompilationDiagnostic> structuredDiagnostics
) {
    public CompilationResult(
        boolean success,
        String mainClassName,
        List<String> allClassNames,
        Path classDir,
        List<String> diagnostics
    ) {
        this(success, mainClassName, allClassNames, classDir, diagnostics, List.of());
    }
}
