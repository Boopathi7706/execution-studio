package com.executionstudio.compiler;

import com.executionstudio.error.CompilationFailure;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.tools.*;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * Compiler implementation using {@code javax.tools.JavaCompiler}.
 *
 * <p>Compiles a single .java source file with debug information ({@code -g} flag)
 * enabled for full variable name capture via JDI. Detects the main class and all
 * class names from the produced .class files.</p>
 */
public class JavacCompiler implements Compiler {

    private static final Logger log = LoggerFactory.getLogger(JavacCompiler.class);

    @Override
    public CompilationResult compile(Path sourceFile, Path outputDir) throws CompilationFailure {
        log.info("Compiling {}", sourceFile.getFileName());

        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) {
            throw new CompilationFailure(
                "System Java compiler not available. Ensure you are running with a JDK, not a JRE.",
                List.of("javax.tools.ToolProvider.getSystemJavaCompiler() returned null")
            );
        }

        try {
            Files.createDirectories(outputDir);
        } catch (IOException e) {
            throw new CompilationFailure("Failed to create output directory: " + outputDir, e);
        }

        DiagnosticCollector<JavaFileObject> diagnosticCollector = new DiagnosticCollector<>();

        try (StandardJavaFileManager fileManager = compiler.getStandardFileManager(diagnosticCollector, null, null)) {
            Iterable<? extends JavaFileObject> compilationUnits =
                fileManager.getJavaFileObjects(sourceFile.toFile());

            // Compile with debug info (-g) for variable names, and output to the specified dir
            List<String> options = List.of(
                "-d", outputDir.toString(),
                "-g"  // Full debug info for JDI variable inspection
            );

            JavaCompiler.CompilationTask task = compiler.getTask(
                null,               // writer (null = System.err)
                fileManager,        // file manager
                diagnosticCollector, // diagnostic listener
                options,            // compiler options
                null,               // annotation processing classes
                compilationUnits    // source files
            );

            boolean success = task.call();

            List<CompilationDiagnostic> structuredDiagnostics = diagnosticCollector.getDiagnostics().stream()
                .map(d -> new CompilationDiagnostic(
                    d.getKind() != null ? d.getKind().name() : "ERROR",
                    d.getSource() != null ? d.getSource().getName() : "<unknown>",
                    d.getLineNumber(),
                    d.getColumnNumber(),
                    d.getMessage(null)
                ))
                .toList();

            List<String> diagnostics = structuredDiagnostics.stream()
                .map(d -> String.format("%s:%d: %s: %s", d.file(), d.line(), d.severity(), d.message()))
                .toList();

            if (!success) {
                log.error("Compilation failed with {} diagnostic(s)", diagnostics.size());
                diagnostics.forEach(d -> log.error("  {}", d));
                return new CompilationResult(false, null, List.of(), outputDir, diagnostics, structuredDiagnostics);
            }

            // Discover all produced class files
            List<String> allClassNames = discoverClassNames(outputDir);
            String mainClassName = detectMainClass(sourceFile);

            log.info("Compilation successful: mainClass={}, allClasses={}", mainClassName, allClassNames);
            return new CompilationResult(true, mainClassName, allClassNames, outputDir, diagnostics, structuredDiagnostics);

        } catch (IOException e) {
            throw new CompilationFailure("Compiler I/O error", e);
        }
    }

    /**
     * Discover all class names from .class files in the output directory.
     */
    private List<String> discoverClassNames(Path outputDir) {
        List<String> classNames = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(outputDir)) {
            walk.filter(p -> p.toString().endsWith(".class"))
                .forEach(p -> {
                    // Convert file path to class name: remove outputDir prefix, remove .class, use dots
                    String relativePath = outputDir.relativize(p).toString();
                    String className = relativePath
                        .replace(File.separatorChar, '.')
                        .replace('/', '.')
                        .replaceAll("\\.class$", "");
                    classNames.add(className);
                });
        } catch (IOException e) {
            log.warn("Failed to discover class names from {}: {}", outputDir, e.getMessage());
        }
        return classNames;
    }

    /**
     * Detect the main class name from the source file name.
     *
     * <p>For single-file programs, the main class is the public class, which must
     * match the source file name. This is a simple heuristic that works for the
     * spike's single-file programs.</p>
     */
    private String detectMainClass(Path sourceFile) {
        String fileName = sourceFile.getFileName().toString();
        return fileName.replaceAll("\\.java$", "");
    }
}
