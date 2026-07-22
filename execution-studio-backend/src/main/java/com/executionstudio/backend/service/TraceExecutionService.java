package com.executionstudio.backend.service;

import com.executionstudio.api.TraceEngine;
import com.executionstudio.api.TraceEngineException;
import com.executionstudio.api.TraceRequest;
import com.executionstudio.api.TraceResult;
import com.executionstudio.backend.dto.TraceRequestDto;
import com.executionstudio.backend.dto.TraceResponseDto;
import com.executionstudio.playback.loader.JacksonTraceLoader;
import com.executionstudio.trace.model.ExecutionTrace;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Objects;
import java.util.UUID;

/**
 * Service orchestrating execution and tracing tasks using standard Spring bean delegation.
 */
@Service
public class TraceExecutionService {

    private static final Logger log = LoggerFactory.getLogger(TraceExecutionService.class);

    private final TraceEngine traceEngine;

    @Autowired
    public TraceExecutionService(TraceEngine traceEngine) {
        this.traceEngine = Objects.requireNonNull(traceEngine, "TraceEngine must not be null");
    }

    /**
     * Executes trace compilation and event capture for a REST request DTO.
     * Handles temporary file creation, engine invocation, trace loading, and cleanup.
     *
     * @param requestDto REST request containing source code and class name
     * @return REST response DTO with execution ID, status, and timeline events
     */
    public TraceResponseDto executeTrace(TraceRequestDto requestDto) {
        String executionId = UUID.randomUUID().toString();
        Path tempDir = null;

        try {
            tempDir = Files.createTempDirectory("trace-exec-");
            Path sourceFile = tempDir.resolve(requestDto.className() + ".java");
            Files.writeString(sourceFile, requestDto.sourceCode());

            TraceRequest request = TraceRequest.builder()
                .sourceFile(sourceFile)
                .className(requestDto.className())
                .outputDirectory(tempDir)
                .build();

            TraceResult result = traceEngine.execute(request);

            ExecutionTrace trace = new JacksonTraceLoader().load(result.traceFile());

            return new TraceResponseDto(
                executionId,
                "SUCCESS",
                trace.events()
            );
        } catch (IOException | com.executionstudio.playback.exception.PlaybackException e) {
            log.error("Failed handling temporary source files or reading trace output", e);
            throw new TraceEngineException("Failed handling trace execution files: " + e.getMessage(), e);
        } finally {
            if (tempDir != null) {
                cleanupTempDir(tempDir);
            }
        }
    }

    /**
     * Delegates trace compilation, execution, and capture requests to the underlying TraceEngine.
     *
     * @param request config request parameters
     * @return result details
     */
    public TraceResult executeTrace(TraceRequest request) {
        return traceEngine.execute(request);
    }

    private void cleanupTempDir(Path tempDir) {
        try (var stream = Files.walk(tempDir)) {
            stream.sorted(Comparator.reverseOrder())
                .forEach(p -> {
                    try {
                        Files.deleteIfExists(p);
                    } catch (IOException ignored) {
                    }
                });
        } catch (IOException e) {
            log.warn("Failed to clean up temp directory: {}", tempDir, e);
        }
    }
}
