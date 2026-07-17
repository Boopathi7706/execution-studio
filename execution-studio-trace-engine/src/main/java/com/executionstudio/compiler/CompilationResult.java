package com.executionstudio.compiler;

import java.nio.file.Path;
import java.util.List;

/**
 * Result of a compilation attempt.
 *
 * @param success       true if compilation succeeded with no errors
 * @param mainClassName the detected main class name (null if not found or compilation failed)
 * @param allClassNames all class names produced by compilation
 * @param classDir      the directory containing compiled .class files
 * @param diagnostics   compiler diagnostic messages (errors and warnings)
 */
public record CompilationResult(
    boolean success,
    String mainClassName,
    List<String> allClassNames,
    Path classDir,
    List<String> diagnostics
) {}
