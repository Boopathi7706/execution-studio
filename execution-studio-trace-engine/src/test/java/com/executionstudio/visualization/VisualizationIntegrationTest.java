package com.executionstudio.visualization;

import com.executionstudio.cli.TraceEngineApp;
import com.executionstudio.config.EngineConfig;
import com.executionstudio.playback.engine.PlaybackEngine;
import com.executionstudio.playback.loader.JacksonTraceLoader;
import com.executionstudio.playback.session.DefaultPlaybackSession;
import com.executionstudio.playback.session.PlaybackSession;
import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.trace.model.ExecutionTrace;
import com.executionstudio.visualization.graph.NodeType;
import com.executionstudio.visualization.mapper.DefaultVisualizationMapper;
import com.executionstudio.visualization.mapper.VisualizationMapper;
import com.executionstudio.visualization.model.ExecutionStatus;
import com.executionstudio.visualization.model.VariableView;
import com.executionstudio.visualization.model.VisualizationModel;
import com.executionstudio.visualization.validation.VisualizationValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class VisualizationIntegrationTest {

    private ExecutionTrace trace;
    private PlaybackSession session;
    private VisualizationMapper mapper;
    private VisualizationValidator validator;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() throws Exception {
        // 1. Compile and run trace collection for Sample.java fixture
        Path sourceFile = Path.of("src/test/resources/fixtures/Sample.java").toAbsolutePath();
        Path outputFile = tempDir.resolve("sample-trace.json");

        EngineConfig config = EngineConfig.builder()
            .sourceFile(sourceFile)
            .outputFile(outputFile)
            .stepLimit(500)
            .timeoutSeconds(15)
            .build();

        new TraceEngineApp().run(config);

        // 2. Load the trace DTO
        trace = new JacksonTraceLoader().load(outputFile);

        // 3. Initialize Playback Session
        session = new DefaultPlaybackSession(trace);

        // 4. Initialize Visualization components
        mapper = new DefaultVisualizationMapper();
        validator = new VisualizationValidator();
    }

    @Test
    void shouldSuccessfullyVerifyCompleteMappingAndIntegrationLifecycle() {
        PlaybackEngine engine = session.getEngine();
        int totalEvents = trace.events().size();

        ExecutionState previousState = null;

        for (int i = 0; i < totalEvents; i++) {
            ExecutionState currentState = engine.currentState();
            boolean isLastStep = (i == totalEvents - 1);

            // Map ExecutionState to presentation-friendly VisualizationModel
            VisualizationModel model = mapper.map(currentState, previousState, isLastStep);

            // Run semantic validator on the mapped presentation DTO
            assertThatCode(() -> validator.validate(model)).doesNotThrowAnyException();

            // General checks
            assertThat(model).isNotNull();
            assertThat(model.highlights().currentLine()).isEqualTo(currentState.position().lineNumber());

            // Status checks
            if (isLastStep) {
                assertThat(model.status()).isEqualTo(ExecutionStatus.COMPLETED);
            } else {
                assertThat(model.status()).isEqualTo(ExecutionStatus.RUNNING);
            }

            // Reference Graph structure checks
            if (!model.heap().objects().isEmpty()) {
                assertThat(model.graph().nodes()).isNotEmpty();
                boolean hasHeapObjects = model.graph().nodes().stream()
                    .anyMatch(n -> n.type() == NodeType.OBJECT || n.type() == NodeType.ARRAY);
                assertThat(hasHeapObjects).isTrue();
            }

            // Variable changed state tracking checks (Specifically for the for-loop counter index variable 'i')
            // Inside Sample.java, loop body is line 12. Let's inspect variables in line 12
            if (currentState.position().lineNumber() == 12 && previousState != null) {
                // Find local variable 'i' in the variables list
                List<VariableView> activeVariables = model.variables().variables();
                VariableView indexVar = activeVariables.stream()
                    .filter(v -> v.name().equals("i"))
                    .findFirst()
                    .orElse(null);

                if (indexVar != null && previousState.position().lineNumber() == 12) {
                    // Stepping through loop iterations should update loop index 'i' value
                    // proving change detection mapped successfully
                    assertThat(indexVar.changed())
                        .as("Loop counter variable 'i' should be marked changed between loop iteration steps")
                        .isTrue();
                }
            }

            // Advance state
            previousState = currentState;
            engine.next();
        }
    }
}
