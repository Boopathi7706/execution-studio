package com.executionstudio.backend.service;

import com.executionstudio.backend.config.BackendProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

class StorageServiceTest {

    private StorageService storageService;
    private BackendProperties backendProperties;
    private Path tempBase;

    @BeforeEach
    void setUp() throws IOException {
        tempBase = Files.createTempDirectory("storage-service-test-");
        backendProperties = new BackendProperties();
        backendProperties.setTempDirectory(tempBase.toString());
        storageService = new StorageService(backendProperties);
    }

    @Test
    void shouldCreateWorkspaceDirectory() {
        Path workspace = storageService.createWorkspace("test-exec-1");

        assertThat(workspace).exists();
        assertThat(workspace.getFileName().toString()).isEqualTo("workspace-test-exec-1");
    }

    @Test
    void shouldSaveSourceFile() throws IOException {
        Path workspace = storageService.createWorkspace("test-exec-2");
        Path sourceFile = storageService.saveSourceFile(workspace, "Main", "public class Main {}");

        assertThat(sourceFile).exists();
        assertThat(sourceFile.getFileName().toString()).isEqualTo("Main.java");
        assertThat(Files.readString(sourceFile)).isEqualTo("public class Main {}");
    }

    @Test
    void shouldSaveTraceFile() throws IOException {
        Path workspace = storageService.createWorkspace("test-exec-3");
        Path traceFile = storageService.saveTraceFile(workspace, "{\"events\":[]}");

        assertThat(traceFile).exists();
        assertThat(traceFile.getFileName().toString()).isEqualTo("trace.json");
        assertThat(Files.readString(traceFile)).isEqualTo("{\"events\":[]}");
    }

    @Test
    void shouldCleanupWorkspaceDirectory() {
        Path workspace = storageService.createWorkspace("test-exec-4");
        storageService.saveSourceFile(workspace, "Main", "public class Main {}");

        assertThat(workspace).exists();

        storageService.cleanupWorkspace(workspace);

        assertThat(workspace).doesNotExist();
    }

    @Test
    void shouldRemoveExpiredFiles() throws IOException {
        Path oldWorkspace = tempBase.resolve("workspace-old");
        Files.createDirectories(oldWorkspace);
        Path recentWorkspace = tempBase.resolve("workspace-recent");
        Files.createDirectories(recentWorkspace);

        // Set last modified time of oldWorkspace to 2 hours ago
        FileTime twoHoursAgo = FileTime.from(Instant.now().minus(120, ChronoUnit.MINUTES));
        Files.setLastModifiedTime(oldWorkspace, twoHoursAgo);

        assertThat(oldWorkspace).exists();
        assertThat(recentWorkspace).exists();

        // Remove workspaces older than 60 minutes
        storageService.removeExpiredFiles(60);

        assertThat(oldWorkspace).doesNotExist();
        assertThat(recentWorkspace).exists();
    }
}
