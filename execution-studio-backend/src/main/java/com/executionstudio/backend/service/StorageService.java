package com.executionstudio.backend.service;

import com.executionstudio.backend.config.BackendProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.Objects;
import java.util.stream.Stream;

/**
 * Centralized service managing workspace lifecycle, file creation, saving, and cleanup.
 */
@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    private final BackendProperties backendProperties;

    @Autowired
    public StorageService(BackendProperties backendProperties) {
        this.backendProperties = Objects.requireNonNull(backendProperties, "BackendProperties must not be null");
    }

    /**
     * Creates an isolated workspace directory for an execution session.
     *
     * @param executionId execution unique identifier
     * @return Path to created workspace directory
     */
    public Path createWorkspace(String executionId) {
        Path baseTemp = Path.of(backendProperties.getTempDirectory());
        try {
            if (!Files.exists(baseTemp)) {
                Files.createDirectories(baseTemp);
            }
            Path workspace = baseTemp.resolve("workspace-" + executionId);
            if (!Files.exists(workspace)) {
                Files.createDirectories(workspace);
            }
            log.debug("Created workspace directory: {}", workspace);
            return workspace;
        } catch (IOException e) {
            log.error("Failed to create workspace for execution {}", executionId, e);
            throw new RuntimeException("Failed to create storage workspace: " + e.getMessage(), e);
        }
    }

    /**
     * Cleans up a workspace directory and all its contents.
     *
     * @param workspaceDir workspace path to delete
     */
    public void cleanupWorkspace(Path workspaceDir) {
        if (workspaceDir == null || !Files.exists(workspaceDir)) {
            return;
        }
        try (Stream<Path> stream = Files.walk(workspaceDir)) {
            stream.sorted(Comparator.reverseOrder())
                .forEach(p -> {
                    try {
                        Files.deleteIfExists(p);
                    } catch (IOException ignored) {
                    }
                });
            log.debug("Cleaned up workspace directory: {}", workspaceDir);
        } catch (IOException e) {
            log.warn("Failed to clean up workspace: {}", workspaceDir, e);
        }
    }

    /**
     * Saves Java source code string into a .java file inside the given workspace.
     *
     * @param workspaceDir workspace path
     * @param className main class name
     * @param sourceCode source code contents
     * @return Path to written source file
     */
    public Path saveSourceFile(Path workspaceDir, String className, String sourceCode) {
        try {
            if (!Files.exists(workspaceDir)) {
                Files.createDirectories(workspaceDir);
            }
            Path sourceFile = workspaceDir.resolve(className + ".java");
            Files.writeString(sourceFile, sourceCode);
            log.debug("Saved source file: {}", sourceFile);
            return sourceFile;
        } catch (IOException e) {
            log.error("Failed saving source file {} in {}", className, workspaceDir, e);
            throw new RuntimeException("Failed saving source file: " + e.getMessage(), e);
        }
    }

    /**
     * Saves trace content into a JSON file inside the workspace directory.
     *
     * @param workspaceDir workspace path
     * @param traceContent trace JSON content string
     * @return Path to written trace file
     */
    public Path saveTraceFile(Path workspaceDir, String traceContent) {
        try {
            if (!Files.exists(workspaceDir)) {
                Files.createDirectories(workspaceDir);
            }
            Path traceFile = workspaceDir.resolve("trace.json");
            Files.writeString(traceFile, traceContent);
            log.debug("Saved trace file: {}", traceFile);
            return traceFile;
        } catch (IOException e) {
            log.error("Failed saving trace file in {}", workspaceDir, e);
            throw new RuntimeException("Failed saving trace file: " + e.getMessage(), e);
        }
    }

    /**
     * Scans and removes expired workspace files and directories older than maxAgeMinutes.
     *
     * @param maxAgeMinutes maximum age in minutes before a workspace is considered expired
     */
    public void removeExpiredFiles(long maxAgeMinutes) {
        Path baseTemp = Path.of(backendProperties.getTempDirectory());
        if (!Files.exists(baseTemp)) {
            return;
        }

        Instant cutoff = Instant.now().minus(maxAgeMinutes, ChronoUnit.MINUTES);

        try (Stream<Path> stream = Files.list(baseTemp)) {
            stream.filter(Files::isDirectory)
                .forEach(dir -> {
                    try {
                        FileTime lastModified = Files.getLastModifiedTime(dir);
                        if (lastModified.toInstant().isBefore(cutoff)) {
                            log.info("Removing expired workspace directory: {}", dir);
                            cleanupWorkspace(dir);
                        }
                    } catch (IOException e) {
                        log.warn("Failed inspecting directory expiry: {}", dir, e);
                    }
                });
        } catch (IOException e) {
            log.error("Error scanning for expired files in {}", baseTemp, e);
        }
    }
}
