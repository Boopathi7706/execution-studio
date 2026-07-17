# Execution Studio — Trace Engine & Playback Engine

A modular Java developer toolkit designed for program execution visualization.

---

## 1. Trace Engine (Spike 01)

A standalone Java CLI tool that compiles a `.java` source file, executes it under the Java Debug Interface (JDI), and produces a complete **Execution Trace** as a JSON file — capturing, at every executed line, the call stack, local variables, and heap object/array state.

### Quick Start

#### Prerequisites
- **JDK 21** or later (must be a full JDK, not a JRE)
- The `JAVA_HOME` environment variable must point to the JDK

#### Build
```bash
./gradlew shadowJar
```
This produces `build/libs/trace-engine.jar`.

#### Run
```bash
java -jar build/libs/trace-engine.jar <source.java> <output-trace.json>
```

**Example:**
```bash
java -jar build/libs/trace-engine.jar src/test/resources/fixtures/Sample.java output/trace.json
```

#### Options
| Option | Default | Description |
|---|---|---|
| `--step-limit <N>` | 50000 | Maximum execution steps before watchdog termination |
| `--timeout <seconds>` | 10 | Maximum wall-clock execution time |
| `--log-level <level>` | INFO | Logging verbosity (TRACE, DEBUG, INFO, WARN, ERROR) |

---

## 2. Playback Engine (Spike 02)

An immutable, JDI-independent timeline navigation engine that reconstructs the complete execution state at any step index using only the serialized `ExecutionTrace`.

```text
ExecutionTrace.json → TraceLoader → PlaybackSession ── Timeline
                                                    └── PlaybackEngine → ExecutionStateBuilder → ExecutionState
```

### Core Architecture Components

- **PlaybackSession**: Root container managing trace state, step pointer (`Timeline`), playback progress (`PlaybackMetadata`), and current `ExecutionState`.
- **Timeline**: Index-based navigator decoupled from execution models.
- **PlaybackEngine**: Coordinates stepping commands and delegates state assembly to the builder.
- **ExecutionStateBuilder**: Reconstructs the stack layout, variable evaluations, and object graphs into pure state models.
- **TraceValidator**: Semantic trace validator enforcing monotonic sequence progression, array length bounds, non-null properties, and broken object references.

### Program State Hierarchy (`ExecutionState`)

The playback state is fully decoupled from live capture proxy entities:
```text
ExecutionState
  ├── position (CurrentPosition: sourceFile, lineNumber)
  ├── stack (StackState: List of FrameState (class, method, line, Locals List))
  ├── heap (HeapState: Map of object ID String to JDI-independent HeapObject)
  └── context (ExecutionStateContext: currentClass, currentMethod, currentEventIndex, exception details)
```

---

## 3. Run Verification Tests
To run all unit tests, integration tests, and validations for both Spike 01 and Spike 02:
```bash
./gradlew test
```

## License
Internal development tool — Execution Studio project.
