package com.executionstudio.compiler;

import com.executionstudio.error.CompilationFailure;

import java.nio.file.Path;

/**
 * Compiles a Java source file into class files.
 *
 * <p><b>Responsibility:</b> Take a .java source file, compile it, and produce class files
 * in the specified output directory.</p>
 *
 * <p><b>Preconditions:</b></p>
 * <ul>
 *   <li>sourceFile exists and is a readable .java file.</li>
 *   <li>outputDir is a writable directory (will be created if absent).</li>
 * </ul>
 *
 * <p><b>Postconditions:</b></p>
 * <ul>
 *   <li>On success: .class files exist in outputDir, result.success() == true,
 *       result.mainClassName() identifies the class with main().</li>
 *   <li>On failure: result.success() == false, result.diagnostics() contains error messages.</li>
 * </ul>
 *
 * <p><b>Thread Safety:</b> Implementations must be safe for sequential use;
 * concurrent use is not required.</p>
 * <p><b>Ownership:</b> Caller owns the CompilationResult and the outputDir contents.</p>
 * <p><b>Failure Conditions:</b> Throws {@link CompilationFailure} only for infrastructure
 * failures (e.g., javac not found). Compilation errors are reported via
 * {@code CompilationResult.diagnostics()}.</p>
 */
public interface Compiler {

    /**
     * Compile a Java source file.
     *
     * @param sourceFile the .java file to compile
     * @param outputDir  the directory for compiled .class files
     * @return the compilation result
     * @throws CompilationFailure if the compiler infrastructure fails
     */
    CompilationResult compile(Path sourceFile, Path outputDir) throws CompilationFailure;
}
