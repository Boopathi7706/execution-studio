# Execution Studio — System Architecture & Contributor Guide

Welcome to the **Execution Studio** architectural blueprint. This document details the system design, components, boundaries, and extension vectors across all completed phases (**Spike 01 through Spike 03**).

It is designed to serve as a comprehensive onboarding guide for new contributors and as the definitive specification of our execution-visualization platform.

---

## 1. System Vision & Data Flow

The central design philosophy of Execution Studio is **strict decoupling of runtime capture, timeline navigation, state calculation, and visual layout rendering**. By structuring the data pipeline as a series of unidirectional, stateless, side-effect-free transformations, we ensure that:
1. The capture layer is completely separated from the playback engine.
2. Playback is entirely separated from the presentational layout and rendering.
3. Any future presentational layer (React, CLI, JavaFX, or mobile views) can render the execution history without undergoing state calculations or compiler diagnostics.

The entire pipeline is structured as follows:

```
[Java Source]
      │
      ▼  (Spike 01 - Compile)
 JavacCompiler (produces bytecode with full debug symbols)
      │
      ▼  (Spike 01 - Launch & Capture)
 JdiRuntimeLauncher & JdiDebugSession (suspend VM, isolate stepping to user classes)
      │
      ▼  (Spike 01 - State Extraction & Identity Mapping)
 LineLevelCaptureStrategy -> ObjectGraphTraverser (maps VM pointers to synthetic stable "obj_N" IDs)
      │
      ▼  (Spike 01 - Serialize)
 JacksonTraceSerializer
      │
      ▼
[ExecutionTrace.json] (The Single Source of Truth - Standardized contract schema)
      │
      ▼  (Spike 02 - Deserialize & Semantic Validate)
 JacksonTraceLoader & TraceValidator (verifies schema, sequence monotonicity, heap references)
      │
      ▼  (Spike 02 - Lifecycle & Navigation Pointer Container)
 PlaybackSession (controls Timeline index pointers and PlaybackEngine)
      │
      ▼  (Spike 02 - State Reconstruction on demand)
 DefaultExecutionStateBuilder (converts static event elements to immutable JDI-free ExecutionState)
      │
      ▼
[ExecutionState] (Point-in-time runtime state model)
      │
      ▼  (Spike 03 - Pure Presentation Mapping)
 DefaultVisualizationMapper (stateless, functional coordinator)
     ├── DefaultStackMapper (translates frame indicators and scopes)
     ├── DefaultHeapMapper (translates VM memory maps to display fields)
     ├── DefaultVariableMapper (performs change detection against previous step variables)
     ├── DefaultGraphBuilder (creates generic node/edge reference graph models)
     └── DefaultHighlightBuilder (calculates active highlights reasons)
      │
      ▼
[VisualizationModel] (Immutable, renderer-independent presentation layout DTO)
      │
      ▼  (Spike 03 - Visual Geometry Layout)
 LayoutEngine (calculates Point2D locations without mutating model state)
      │
      ▼
[LayoutModel] (Static coordinates mappings)
      │
      ▼
[Presentational Renderers] (HTML/Canvas/React, Monaco code editor, CLI table views)
```

---

## 2. Layer-by-Layer Architecture & Responsibilities

### 2.1 The Capture Layer (Trace Engine — Spike 01)
**Purpose:** Programmatically compile a target Java file and execute it under debug instrumentation to log every execution step (line hits and uncaught exceptions) along with its visible state.

**Core Responsibilities:**
- **In-Memory Compilation:** Programmatically invoke `javax.tools.JavaCompiler` with debug flags (`-g`) enabled. Scan directory outputs to capture all compiled class files to compile class lists for event filters.
- **Instrumented Stepping:** Launch a child JVM suspended. Register step requests (`StepRequest.STEP_LINE`, `StepRequest.STEP_INTO`) and limit breakpoints strictly to user-compiled classes. Skip all JDK internals (e.g. `java.*`, `sun.*`) via exclusion filters.
- **Reference Identity Translation:** Keep trace mappings stable across different execution points. Translate JVM internal reference pointers (`ObjectReference.uniqueID()`) into synthetic, compact, human-readable IDs (`"obj_1"`, `"obj_2"`, etc.) that remain identical across consecutive execution frames.
- **Object Graph Traversal:** Traverse the active thread stack frames. For each local variable, recursively scan fields and elements. Enforce traversal policies (depth limits, element caps, and cycle detection sets) to guarantee safety when capturing deep or self-referential classes.

### 2.2 The Timeline Player Layer (Playback Engine — Spike 02)
**Purpose:** Reconstruct the complete runtime state at any arbitrary step index using only the static execution trace, with absolutely no dependencies on JDI, active JVMs, or Java source files.

**Core Responsibilities:**
- **Polymorphic Jackson Loader:** Load the JSON files and reconstruct polymorphic value variants (`DisplayValue.Primitive`, `DisplayValue.ObjectRef`, etc.) and object mappings (`ObjectSnapshot`, `ArraySnapshot`).
- **Semantic Compiler-Style Validator:** Execute strict validations verifying trace schema, sequence monotonicity, array sizes, stack depth limits, and reference constraints (detects dangling heap references and duplicates).
- **Index-Based Navigation:** Control stepping using a stateful index pointer (`Timeline`) decoupled from the data models. The timeline only manages boundary conditions (first, last, index updates) and has zero knowledge of trace events.
- **State Reconstruction on Demand:** Rebuild the immutable `ExecutionState` for any index, containing line positions, call stacks, active frames, heap snapshot tables, and execution contexts.

### 2.3 The Presentation Layer (Visualization Model — Spike 03)
**Purpose:** Transform the point-in-time `ExecutionState` into a highly optimized, generic `VisualizationModel` ready for rendering.

**Core Responsibilities:**
- **Value Change Detection:** Perform stateless value comparisons. By comparing the current variables with the previous step variables, it flags which variables have changed value to trigger UI animation effects.
- **Reference Graph Construction:** Convert visual variables and heap objects into a directed reference graph consisting of generic `GraphNode` and `GraphEdge` maps, fully typed via enums (`NodeType` and `EdgeType`).
- **Visual Highlight Mapping:** Build execution highlighted coordinates, mapping highlight reasons (`HighlightReason.CURRENT`, `HighlightReason.CHANGED`, `HighlightReason.CREATED`) to targets.
- **Functional Immutable Layout:** Compute coordinates positioning without modifying the model. The `LayoutEngine` consumes the model and returns a separate, immutable mapping of component IDs to `Point2D` coordinate points.

---

## 3. Package Structure

```text
com.executionstudio
│
├── cli
│   └── TraceEngineApp.java            # CLI orchestrator & main pipeline
│
├── compiler
│   ├── Compiler.java                  # Compilation interface contract
│   ├── JavacCompiler.java             # javax.tools compiler wrapper
│   └── CompilationResult.java         # Diagnostic & class outputs DTO
│
├── config
│   └── EngineConfig.java              # Configuration variables & thresholds
│
├── context
│   ├── ExecutionContext.java          # Capture context bus container
│   └── SequenceGenerator.java         # Monotonic sequence ID generator
│
├── error
│   ├── TraceEngineException.java      # Base engine exception
│   ├── CompilationFailure.java        # Compilation syntax errors container
│   ├── LaunchFailure.java             # Child JVM launch errors
│   ├── DebugConnectionFailure.java    # JDI wire connection failures
│   ├── TimeoutExceeded.java           # Watchdog runtime timeout
│   ├── StepLimitExceeded.java         # Watchdog step limit hit
│   └── SerializationFailure.java      # Jackson serialization errors
│
├── launcher
│   ├── RuntimeLauncher.java           # child JVM launcher interface
│   ├── JdiRuntimeLauncher.java        # LaunchingConnector connector
│   ├── DebugSession.java              # Event loop orchestrator interface
│   └── JdiDebugSession.java           # JDI class filter & event step dispatcher
│
├── jdi.capture
│   ├── CaptureStrategy.java           # JDI event handler interface
│   ├── LineLevelCaptureStrategy.java   # Event logic (steps, exceptions, VM exits)
│   ├── ObjectRegistry.java            # synthetic ID mapping interface
│   ├── DefaultObjectRegistry.java     # uniqueID() translation tracker
│   ├── ObjectGraphTraverser.java      # Recursion orchestrator
│   ├── TraversalPolicy.java           # Depth, array limits & cycle detection
│   ├── TraversalResult.java           # Value + discovered heap DTO
│   ├── HeapSnapshotFactory.java       # JDI Values to DTO translator
│   ├── StepContext.java               # Step event parameters wrapper
│   └── ExceptionContext.java          # Exception event parameters wrapper
│
├── runtime.events
│   ├── RuntimeEvent.java              # Sealed event interface (permits LineEvent, ExceptionEvent)
│   ├── LineEvent.java                 # Record representing a line step
│   ├── ExceptionEvent.java            # Record representing an uncaught exception
│   ├── FrameSnapshot.java             # Call stack frame variables list
│   ├── VariableSnapshot.java          # Local variable name, type, and HeapValue
│   ├── HeapValue.java                 # Sealed visual JDI values interface
│   └── HeapObject.java                # Sealed heap object / array snapshot interface
│
├── trace
│   ├── model
│   │   ├── ExecutionTrace.java        # Top-level serialization model
│   │   ├── TraceMetadata.java         # Tooling versions, timers, exit reason
│   │   ├── TraceEvent.java            # Unified serializable trace step
│   │   └── TraceStatistics.java       # Execution statistics DTO
│   └── builder
│       ├── TraceBuilder.java          # Trace builder interface
│       └── SnapshotTraceBuilder.java  # Full heap snapshot builder implementation
│
├── serializer
│   ├── TraceSerializer.java           # Serialization interface
│   └── JacksonTraceSerializer.java    # ObjectMapper JSON writer
│
├── statistics
│   ├── StatisticsCollector.java       # Metric collector interface
│   └── DefaultStatisticsCollector.java # Counters (methods, loops, allocations)
│
├── watchdog
│   └── Watchdog.java                  # Step and wall-clock safety timers
│
├── source
│   ├── SourceFile.java                # Placeholder stub
│   ├── SourceLocation.java            # Placeholder stub
│   └── SourceStatement.java           # Placeholder stub
│
└── playback
    ├── loader
    │   ├── TraceLoader.java           # Deserialization interface
    │   └── JacksonTraceLoader.java    # Jackson loader & validator integration
    │
    ├── validation
    │   └── TraceValidator.java        # Semantic compiler-style trace validator
    │
    ├── exception
    │   ├── PlaybackException.java     # Base playback exception
    │   └── InvalidTraceException.java # Validation failures exception
    │
    ├── timeline
    │   ├── Timeline.java              # Index navigator interface
    │   └── DefaultTimeline.java       # Bounds and pointer stepper
    │
    ├── state
    │   ├── ExecutionState.java        # Immutable domain state record
    │   ├── CurrentPosition.java       # Line and file coordinates
    │   ├── StackState.java            # Active call frames collection
    │   ├── FrameState.java            # Frame coordinates and locals
    │   ├── VariableState.java         # Variable name, type, HeapValue
    │   ├── HeapState.java             # Heap object snap map
    │   ├── ExecutionStateContext.java # Class, method, index, exceptions context
    │   ├── ExecutionStateBuilder.java # Reconstructor interface
    │   └── DefaultExecutionStateBuilder.java # Reconstructor implementation
    │
    ├── engine
    │   ├── PlaybackEngine.java        # Stepping interface
    │   └── DefaultPlaybackEngine.java # Timeline engine orchestrator
    │
    └── session
        ├── PlaybackSession.java       # Active root session container interface
        ├── DefaultPlaybackSession.java # Default lifecycle session container
        └── PlaybackMetadata.java      # Step trackers & progress percentage DTO
```

---

## 4. Public APIs & Core Contracts

### 4.1 Trace Engine (Capture)

```java
package com.executionstudio.compiler;

public interface Compiler {
    /**
     * Compiles a .java source file into the output directory with debug flags (-g).
     * Preconditions: sourceFile exists and is readable; outputDir is writable.
     * Postconditions: Result exposes main class name, list of compiled class names, success flag.
     * Throws: CompilationFailure on compiler system issues. Syntax errors are collected in result diagnostics.
     */
    CompilationResult compile(Path sourceFile, Path outputDir) throws CompilationFailure;
}
```

```java
package com.executionstudio.launcher;

public interface RuntimeLauncher {
    /**
     * Launches a child target VM in suspended mode, configured for debugger attachment.
     * Preconditions: mainClass matches class containing main() in classDir.
     * Postconditions: Connected DebugSession is returned, child VM remains suspended.
     */
    DebugSession launch(String mainClass, Path classDir, List<String> allClassNames) throws LaunchFailure;
}

public interface DebugSession extends AutoCloseable {
    /**
     * Resumes the suspended VM, executes the step loop, and forwards events to capture strategies.
     * Respects the watchdog's step limits and execution timeouts.
     */
    void run(CaptureStrategy strategy, Watchdog watchdog);
    void terminate();
}
```

### 4.2 Playback Engine

```java
package com.executionstudio.playback.loader;

public interface TraceLoader {
    /**
     * Deserializes and semantically validates an execution trace JSON file.
     * Throws: PlaybackException on format failures or semantic reference mismatches.
     */
    ExecutionTrace load(Path traceFile) throws PlaybackException;
}
```

```java
package com.executionstudio.playback.engine;

public interface PlaybackEngine {
    /** Steps forward one step and returns the reconstructed ExecutionState. */
    ExecutionState next();
    /** Steps backward one step and returns the reconstructed ExecutionState. */
    ExecutionState previous();
    /** Seeks to the specific target index and returns the reconstructed ExecutionState. */
    ExecutionState seek(int index);
    /** Returns the current execution state without changing index position. */
    ExecutionState currentState();
    void restart();
    int currentIndex();
    boolean hasNext();
    boolean hasPrevious();
}
```

### 4.3 Presentation & Visualization Layer

```java
package com.executionstudio.visualization.mapper;

public interface VisualizationMapper {
    /**
     * Stateless translation mapping execution state into presentation-friendly models.
     * Performs variable change calculations by comparing currentValue against previousValue.
     *
     * @param state         current execution state DTO
     * @param previousState previous execution state DTO (nullable)
     * @param isLastStep    true if current step corresponds to the final trace step
     * @return presentation model DTO
     */
    VisualizationModel map(ExecutionState state, ExecutionState previousState, boolean isLastStep);
}
```

```java
package com.executionstudio.visualization.layout;

public interface LayoutEngine {
    /**
     * Computes visual element positions cleanly without mutating model fields.
     *
     * @param model the immutable presentation model
     * @return layout coordinates positions map (Point2D coordinates mapped to component IDs)
     */
    LayoutModel calculateLayout(VisualizationModel model);
}
```

---

## 5. Architectural Decision Records (ADRs)

### ADR-0001: Programmatic Step Tracing via JVM Debug Interface (JDI)
- **Context:** We need to capture line-by-line runtime contexts (call stack frames, local variables, object graphs) from running Java code.
- **Decision:** Drive execution programmatically using JDI (`com.sun.jdi` module) through `LaunchingConnector`. Step line-by-line (`STEP_LINE`, `STEP_INTO`) and trap thread variables.
- **Alternatives Considered:**
  - *ASM/ByteBuddy Bytecode Instrumentation:* Extreme execution performance, but complex to implement, hard to translate local stack frames cleanly, and injects runtime classes into target code.
  - *Source Code AST instrumentation:* Easy to trace line hits, but fragile, fails on compound lines, and does not capture memory object values cleanly.
- **Consequences:** Confines debug capabilities safely to standard JVM features (ships by default in JDKs). Execution stepping is slower than native runs (~1ms per step), but completely acceptable for development-scale programs. A future compiler/launcher replacement can swap this capture mechanism without modifying downstream pipelines.

### ADR-0002: Strict JDI Isolation Boundary
- **Context:** JDI types (`ObjectReference`, `StackFrame`, etc.) are live proxies linked to the active thread state of the child target JVM. These proxies become invalid or raise thread access errors as soon as the VM is resumed.
- **Decision:** **All JDI imports and type variables are strictly confined within the `jdi.capture` package.** The capture strategy translates JDI proxy entities into JDI-free record DTOs (`VariableSnapshot`, `FrameSnapshot`, `HeapValue`) immediately at the point of capture during thread suspension. No JDI type ever escapes this package boundary.
- **Consequences:** Protects downstream code (trace serializer, playback, and rendering) from thread access issues. The remainder of the system runs entirely on standard Java objects, completely decoupled from JDI.

### ADR-0003: Full Heap Snapshots per Execution Step
- **Context:** When replaying execution frames, we must present the visible heap state of active references.
- **Decision:** Each `TraceEvent` contains a complete snapshot of all heap objects reachable from the active stack frames at that step (Full Heap Snapshot Mode).
- **Alternatives Considered:**
  - *Delta/Diff Encoding:* Write only heap modifications (creations, edits, destructions) per step. Highly compressed on disk, but requires the playback player to sequentially replay all steps from index 0 to calculate the state at index $N$, preventing fast arbitrary seeking.
- **Consequences:** Execution trace JSON files are larger, but arbitrary seeking to any index $N$ is highly efficient and runs in $O(1)$ constant time. Simplifies serialization and validator implementation. The builder interfaces (`TraceBuilder` and `ExecutionStateBuilder`) abstract this decision, enabling a future `DeltaTraceBuilder` to compress traces without impacting consumers.

### ADR-0004: Stable Synthetic Object Identifiers
- **Context:** JDI's `ObjectReference.uniqueID()` is a temporary session-specific memory pointer. Replaying objects requires stable pointer comparisons to verify references (e.g. confirming if two variables share the same memory instance).
- **Decision:** Use an `ObjectRegistry` mapping runtime JDI `uniqueID()` keys to synthetic, stable strings (`"obj_1"`, `"obj_2"`, etc.) that remain identical across consecutive execution frames.
- **Consequences:** Memory references remain stable. Rendering graphs can easily check if `"obj_1"` is shared by stack frame variable arrays and heap fields.

### ADR-0005: Decoupled Index-Based Timeline Pointer
- **Context:** The playback player must navigate the execution steps (next, previous, seek).
- **Decision:** The `Timeline` component operates strictly on integer indexes (step pointer positions), decoupled from the execution trace data or event models.
- **Consequences:** Zero dependency on model classes. The `PlaybackEngine` queries the index from the timeline and passes it to the `ExecutionStateBuilder` to calculate states on demand.

### ADR-0006: Immutable Geometry Layout Model
- **Context:** Rendering UIs require 2D canvas coordinates mapping. Mutation of states should be avoided.
- **Decision:** `LayoutEngine` is designed as a purely functional mapping calculator. It consumes an immutable `VisualizationModel` and outputs a separate `LayoutModel` DTO containing coordinates positions (`Point2D`) mapped to component IDs.
- **Consequences:** The core visualization DTO remains immutable, thread-safe, and side-effect-free.

---

## 6. Contributor Onboarding: Extensibility How-To Guides

### 6.1 How to Add a New Visual Value Variant (e.g. Visualizing `BigDecimal`)
Currently, `DisplayValue` abstracts values for presentation. Suppose we want to add a dedicated visual representation for `BigDecimal` to display decimal parameters differently from standard primitives:

1. **Update `DisplayValue.java`:**
   In [DisplayValue.java](file:///d:/Projects/Execution%20Studio/execution-studio-trace-engine/src/main/java/com/executionstudio/visualization/model/DisplayValue.java), add the record variant and include it in the `permits` clause:
   ```java
   public sealed interface DisplayValue permits
       ...
       DisplayValue.BigDecimalVal {
       
       record BigDecimalVal(String valueString) implements DisplayValue {
           @Override public String kind() { return "big_decimal"; }
       }
   }
   ```
2. **Configure Jackson Subtypes:**
   Update the subtype annotations in [DisplayValue.java](file:///d:/Projects/Execution%20Studio/execution-studio-trace-engine/src/main/java/com/executionstudio/visualization/model/DisplayValue.java) and register it in [JacksonTraceLoader.java](file:///d:/Projects/Execution%20Studio/execution-studio-trace-engine/src/main/java/com/executionstudio/playback/loader/JacksonTraceLoader.java):
   ```java
   objectMapper.registerSubtypes(DisplayValue.BigDecimalVal.class);
   ```
3. **Update Variable Mapper:**
   In [DefaultVariableMapper.java](file:///d:/Projects/Execution%20Studio/execution-studio-trace-engine/src/main/java/com/executionstudio/visualization/mapper/DefaultVariableMapper.java), update the switch expression in `mapToDisplayValue(HeapValue val)` to check if the value runtime type represents a decimal, mapping it to the new `BigDecimalVal` record.

### 6.2 How to Add a New Step Event Type (e.g. Capturing `ConsoleOutputEvent`)
Currently, `RuntimeEvent` permits `LineEvent` and `ExceptionEvent`. If we want to capture standard console prints (`System.out.print`):

1. **Update `RuntimeEvent.java`:**
   In [RuntimeEvent.java](file:///d:/Projects/Execution%20Studio/execution-studio-trace-engine/src/main/java/com/executionstudio/runtime/events/RuntimeEvent.java), add the record and update the `permits` clause:
   ```java
   public sealed interface RuntimeEvent permits LineEvent, ExceptionEvent, ConsoleOutputEvent {
       record ConsoleOutputEvent(int seq, String output) implements RuntimeEvent {
           @Override public String type() { return "console_output"; }
       }
   }
   ```
2. **Capture JDI Print stream Calls:**
   In [JdiDebugSession.java](file:///d:/Projects/Execution%20Studio/execution-studio-trace-engine/src/main/java/com/executionstudio/launcher/JdiDebugSession.java), configure JDI MethodEntryRequests for print stream methods (e.g. `java.io.PrintStream.println`), trap the string argument, and dispatch it to the `CaptureStrategy` to append a `ConsoleOutputEvent` to the trace builder.
3. **Support Serialization & Validation:**
   Update Jackson mapping targets in [JacksonTraceSerializer.java](file:///d:/Projects/Execution%20Studio/execution-studio-trace-engine/src/main/java/com/executionstudio/serializer/JacksonTraceSerializer.java) and implement validation checks in [TraceValidator.java](file:///d:/Projects/Execution%20Studio/execution-studio-trace-engine/src/main/java/com/executionstudio/playback/validation/TraceValidator.java).

### 6.3 How to Implement a New Layout Engine (e.g. Force-Directed Layout)
Suppose we want to implement a spring-mass layout calculation for reference graphs:

1. **Implement `LayoutEngine`:**
   Create a new class under `com.executionstudio.visualization.layout`:
   ```java
   package com.executionstudio.visualization.layout;
   
   import com.executionstudio.visualization.model.VisualizationModel;
   import java.util.HashMap;
   import java.util.Map;
   
   public class ForceDirectedLayoutEngine implements LayoutEngine {
       @Override
       public LayoutModel calculateLayout(VisualizationModel model) {
           Map<String, Point2D> coordinates = new HashMap<>();
           // Execute spring physical algorithm on model.graph().nodes() and edges()
           // ...
           return new LayoutModel(coordinates);
       }
   }
   ```

### 6.4 How to Swap a Delta Trace Builder
To optimize trace size, a developer can replace `SnapshotTraceBuilder` with a delta trace implementation without affecting public engine steps:

1. **Implement `TraceBuilder`:**
   Create a new builder tracking changes:
   ```java
   public class DeltaTraceBuilder implements TraceBuilder {
       // Track variable diffs instead of writing full heap snapshots per event
   }
   ```
2. **Implement `ExecutionStateBuilder`:**
   Create a corresponding reconstructor that reads delta frames sequentially and builds the current heap state:
   ```java
   public class DeltaExecutionStateBuilder implements ExecutionStateBuilder {
       // Replay delta events from index 0 up to targetIndex to rebuild full state
   }
   ```
3. **Register in Session:**
   Supply the new `DeltaExecutionStateBuilder` to the `PlaybackSession` context.

---

## 7. Pipeline Validation Framework

The **Pipeline Validation Framework** is a testing and diagnostic suite that exercises and integrates the entire backend pipeline. It acts as the primary integration gatekeeper to prove that all changes maintain end-to-end data integrity.

### 7.1 Pipeline Integration Flow

```
[Target Program (.java)] ──(Javac & JDI)──► [ExecutionTrace (JSON)] ──(Jackson Loader & Validator)──► [PlaybackEngine] ──► [VisualizationMapper] ──► [TextConsoleRenderer]
```

### 7.2 Core Verification Components

- **`PipelineValidationFramework`**: Programmatically runs compilations, captures trace logs, steps through timeline events, maps execution states, runs semantic validators, and outputs formatted ASCII logs.
- **`TextConsoleRenderer`**: Translates `VisualizationModel` snapshot DTOs into structured, human-readable terminal prints—detailing stacks, variable states with change highlights, arrays/objects layout structures, and referenced pointer connections.
- **`ValidationReport`**: Collects and exposes metrics (trace files sizes, exception logs, stack counts, and visual model checks) for each sample file.

### 7.3 Executing Validation

Validation can be triggered via automated tests or command line runs:

#### 1. Automated Integration Tests
```bash
./gradlew test --tests "*PipelineValidationFrameworkTest*"
```

#### 2. Programmatic CLI Runner
```bash
java -cp build/libs/trace-engine.jar com.executionstudio.cli.PipelineValidatorApp
```
Exits with status `0` if all files in `samples/` compile, step, map, and pass semantic constraints. Exits with status `1` on any failure. Detail renders logs are saved to `output/validation/validation-render.log`.

---

## 8. Future Roadmap

As Execution Studio transitions from architectural feasibility spikes to product delivery, the roadmap includes the following capabilities:

- **Multi-Threaded Capture Execution:** Expand JDI `StepRequest` bindings to track and log execution events across multiple concurrent thread tracks, mapping active threads to distinct timeline lanes.
- **WebSocket Real-Time Streaming:** Shift from batch JSON disk writing to streaming tracing events over WebSockets. Allows a frontend React application to render visualizations in real-time while the target JVM runs.
- **AST-Linked Monaco Code Highlights:** Integrate compiler AST data structures (`com.executionstudio.source` package) to map line events directly to columns and scopes, supporting sub-statement highlights.
- **Time-Travel Interactive Debugging:** Expand the Playback Engine to support reverse execution edits (letting users modify variable values during timeline replay and re-running the JDI session from that point in time).
