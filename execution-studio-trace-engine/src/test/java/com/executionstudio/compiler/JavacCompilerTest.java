package com.executionstudio.compiler;

import com.executionstudio.error.CompilationFailure;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class JavacCompilerTest {

    @TempDir
    Path tempDir;

    @Test
    void shouldCompileValidSourceFile() throws IOException, CompilationFailure {
        Path sourceFile = tempDir.resolve("HelloWorld.java");
        Files.writeString(sourceFile, """
            public class HelloWorld {
                public static void main(String[] args) {
                    System.out.println("Hello, World!");
                }
            }
            """);

        Path outputDir = tempDir.resolve("output");
        JavacCompiler compiler = new JavacCompiler();
        CompilationResult result = compiler.compile(sourceFile, outputDir);

        assertThat(result.success()).isTrue();
        assertThat(result.mainClassName()).isEqualTo("HelloWorld");
        assertThat(result.allClassNames()).contains("HelloWorld");
        assertThat(result.classDir()).isEqualTo(outputDir);
        assertThat(outputDir.resolve("HelloWorld.class")).exists();
    }

    @Test
    void shouldDetectMultipleClassesInSingleFile() throws IOException, CompilationFailure {
        Path sourceFile = tempDir.resolve("Multi.java");
        Files.writeString(sourceFile, """
            public class Multi {
                public static void main(String[] args) {}
            }
            class Helper {
                int x;
            }
            """);

        Path outputDir = tempDir.resolve("output");
        JavacCompiler compiler = new JavacCompiler();
        CompilationResult result = compiler.compile(sourceFile, outputDir);

        assertThat(result.success()).isTrue();
        assertThat(result.allClassNames()).containsExactlyInAnyOrder("Multi", "Helper");
    }

    @Test
    void shouldReportCompilationErrors() throws IOException, CompilationFailure {
        Path sourceFile = tempDir.resolve("BadCode.java");
        Files.writeString(sourceFile, """
            public class BadCode {
                public static void main(String[] args) {
                    int x = ;  // Syntax error
                }
            }
            """);

        Path outputDir = tempDir.resolve("output");
        JavacCompiler compiler = new JavacCompiler();
        CompilationResult result = compiler.compile(sourceFile, outputDir);

        assertThat(result.success()).isFalse();
        assertThat(result.diagnostics()).isNotEmpty();
    }
}
