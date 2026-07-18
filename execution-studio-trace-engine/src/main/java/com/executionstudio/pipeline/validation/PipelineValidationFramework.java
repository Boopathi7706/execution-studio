package com.executionstudio.pipeline.validation;

import com.executionstudio.cli.TraceEngineApp;
import com.executionstudio.config.EngineConfig;
import com.executionstudio.playback.engine.PlaybackEngine;
import com.executionstudio.playback.loader.JacksonTraceLoader;
import com.executionstudio.playback.session.DefaultPlaybackSession;
import com.executionstudio.playback.session.PlaybackSession;
import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.playback.validation.TraceValidator;
import com.executionstudio.trace.model.ExecutionTrace;
import com.executionstudio.visualization.mapper.DefaultVisualizationMapper;
import com.executionstudio.visualization.mapper.VisualizationMapper;
import com.executionstudio.visualization.model.VisualizationModel;
import com.executionstudio.visualization.validation.VisualizationValidator;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * Orchestrator framework that exercises the complete Execution Studio pipeline:
 * Java File -> Compile & Trace Capture -> Deserialize -> Timeline Playback -> Presentation Mapping -> Console Render.
 */
public class PipelineValidationFramework {

    private final Path samplesDir;
    private final Path outputDir;

    private final JacksonTraceLoader traceLoader = new JacksonTraceLoader();
    private final TraceValidator traceValidator = new TraceValidator();
    private final VisualizationMapper visMapper = new DefaultVisualizationMapper();
    private final VisualizationValidator visValidator = new VisualizationValidator();
    private final TextConsoleRenderer consoleRenderer = new TextConsoleRenderer();

    public PipelineValidationFramework(Path samplesDir, Path outputDir) {
        this.samplesDir = samplesDir;
        this.outputDir = outputDir;
    }

    /**
     * Executes validation across all programs in samples directory.
     *
     * @return consolidated list of validation reports
     */
    public List<ValidationReport> runValidation() throws IOException {
        Files.createDirectories(outputDir);
        List<ValidationReport> reports = new ArrayList<>();

        if (!Files.exists(samplesDir) || !Files.isDirectory(samplesDir)) {
            System.err.println("Samples directory does not exist: " + samplesDir.toAbsolutePath());
            return reports;
        }

        List<Path> javaFiles;
        try (Stream<Path> s = Files.list(samplesDir)) {
            javaFiles = s.filter(p -> p.toString().endsWith(".java")).toList();
        }

        System.out.println("Discovered " + javaFiles.size() + " sample files in: " + samplesDir.toAbsolutePath());

        Path rendersLogFile = outputDir.resolve("validation-render.log");
        try (PrintWriter logWriter = new PrintWriter(Files.newBufferedWriter(rendersLogFile))) {
            logWriter.println("=== EXECUTION STUDIO VALIDATION RENDER LOG ===");
            logWriter.println("Generated at: " + java.time.Instant.now());
            logWriter.println();

            for (Path javaFile : javaFiles) {
                String programName = javaFile.getFileName().toString();
                System.out.println("Processing sample: " + programName);
                ValidationReport report = validateProgram(javaFile, logWriter);
                reports.add(report);
            }
        }

        System.out.println("Validation execution complete. Detail logs saved to: " + rendersLogFile.toAbsolutePath());
        return reports;
    }

    private ValidationReport validateProgram(Path javaFile, PrintWriter logWriter) {
        String filename = javaFile.getFileName().toString();
        String mainClass = filename.substring(0, filename.lastIndexOf('.'));
        ValidationReport report = new ValidationReport(filename);

        Path traceFile = outputDir.resolve(mainClass + "-trace.json");

        // 1. Run Compile and Trace Engine Capture via TraceEngineApp
        try {
            // Configure limits: 200 steps limit, 15 seconds timeout
            EngineConfig config = EngineConfig.builder()
                .sourceFile(javaFile)
                .outputFile(traceFile)
                .stepLimit(200)
                .timeoutSeconds(15)
                .build();

            TraceEngineApp traceEngine = new TraceEngineApp();
            traceEngine.run(config);

            report.setCompilationSuccess(true);
            report.setTraceGenerationSuccess(true);
            if (Files.exists(traceFile)) {
                report.setTraceFileSize(Files.size(traceFile));
            }
        } catch (Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            report.addError("CAPTURE_PHASE", "Compilation or execution capture failed:\n" + e.getMessage() + "\n" + sw);
            return report;
        }

        // 2. Deserialize Trace JSON using TraceLoader
        ExecutionTrace trace;
        try {
            trace = traceLoader.load(traceFile);
            report.setEventCount(trace.events().size());
        } catch (Exception e) {
            report.addError("DESERIALIZE_PHASE", "Failed to deserialize trace JSON: " + e.getMessage());
            return report;
        }

        // 3. Validate Trace Semantics using TraceValidator
        try {
            traceValidator.validate(trace);
        } catch (Exception e) {
            report.addError("VALIDATION_PHASE", "Trace semantic validation failed: " + e.getMessage());
        }

        // 4. Load steps sequentially into Playback Engine, map states, validate visual DTOs, render to console
        try {
            PlaybackSession playbackSession = new DefaultPlaybackSession(trace);
            PlaybackEngine engine = playbackSession.getEngine();
            report.setPlaybackSuccess(true);

            int totalEvents = trace.events().size();
            ExecutionState previousState = null;

            logWriter.println("--------------------------------------------------------------------------------");
            logWriter.println("Renders for: " + filename);
            logWriter.println("--------------------------------------------------------------------------------");

            for (int i = 0; i < totalEvents; i++) {
                ExecutionState currentState = engine.currentState();
                boolean isLastStep = (i == totalEvents - 1);

                // Map execution DTO state to presentation layout view
                VisualizationModel visModel = visMapper.map(currentState, previousState, isLastStep);

                // Check visual model semantic integrity
                try {
                    visValidator.validate(visModel);
                } catch (Exception e) {
                    report.addError("VISUAL_VALIDATION_PHASE", String.format("Visual model consistency failed at index %d: %s", i, e.getMessage()));
                }

                // Render visualization layout snapshot
                String renderedAscii = consoleRenderer.render(visModel);
                logWriter.println("Step " + i + " Render Snapshot:");
                logWriter.println(renderedAscii);

                report.setPlaybackStepsVerified(i + 1);
                previousState = currentState;
                engine.next();
            }

            report.setMappingSuccess(true);
        } catch (Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            report.addError("PLAYBACK_MAPPING_PHASE", "Stepping, mapping, or rendering failed:\n" + e.getMessage() + "\n" + sw);
        }

        return report;
    }
}
