package com.executionstudio.playback.session;

import com.executionstudio.cli.TraceEngineApp;
import com.executionstudio.config.EngineConfig;
import com.executionstudio.playback.engine.PlaybackEngine;
import com.executionstudio.playback.loader.JacksonTraceLoader;
import com.executionstudio.playback.state.ExecutionState;
import com.executionstudio.trace.model.ExecutionTrace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class PlaybackSessionIntegrationTest {

    private ExecutionTrace trace;
    private PlaybackSession session;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() throws Exception {
        // 1. Dynamically generate trace for Sample.java using Spike 01 CLI
        Path sourceFile = Path.of("src/test/resources/fixtures/Sample.java").toAbsolutePath();
        Path outputFile = tempDir.resolve("sample-trace.json");

        EngineConfig config = EngineConfig.builder()
            .sourceFile(sourceFile)
            .outputFile(outputFile)
            .stepLimit(500)
            .timeoutSeconds(15)
            .build();

        TraceEngineApp app = new TraceEngineApp();
        app.run(config);

        // 2. Load trace using JacksonTraceLoader
        JacksonTraceLoader loader = new JacksonTraceLoader();
        trace = loader.load(outputFile);

        // 3. Initialize session
        session = new DefaultPlaybackSession(trace);
    }

    @Test
    void shouldSuccessfullyVerifyLifecycleAndStateIntegrity() {
        assertThat(session.getTrace()).isEqualTo(trace);
        assertThat(session.getTimeline().currentIndex()).isEqualTo(0);

        PlaybackEngine engine = session.getEngine();
        ExecutionState initialState = engine.currentState();
        assertThat(initialState).isNotNull();
        assertThat(initialState.context().currentEventIndex()).isEqualTo(0);
        assertThat(initialState.position().lineNumber()).isEqualTo(7); // starts at int a = 5

        // Verify metadata at start
        PlaybackMetadata startMeta = session.getMetadata();
        assertThat(startMeta.currentStep()).isEqualTo(1);
        assertThat(startMeta.totalSteps()).isEqualTo(trace.events().size());
        assertThat(startMeta.progressPercentage()).isEqualTo(0.0);

        // Step forward and verify progression
        int lastIndex = session.getTimeline().lastIndex();
        ExecutionState nextState = engine.next();
        assertThat(nextState.context().currentEventIndex()).isEqualTo(1);

        // Seek to final event
        ExecutionState finalState = engine.seek(lastIndex);
        assertThat(finalState.context().currentEventIndex()).isEqualTo(lastIndex);
        assertThat(session.getMetadata().progressPercentage()).isEqualTo(100.0);

        // Step backward from end
        ExecutionState prevState = engine.previous();
        assertThat(prevState.context().currentEventIndex()).isEqualTo(lastIndex - 1);

        // Seek to random index and check stability
        int randomIndex = lastIndex / 2;
        ExecutionState state1 = engine.seek(randomIndex);
        ExecutionState state2 = engine.seek(randomIndex); // seek same index
        assertThat(state1).isEqualTo(state2); // State reconstruction is deterministic
    }
}
