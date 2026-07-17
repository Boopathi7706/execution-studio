# Execution Studio — Trace Engine (Spike 01)

A standalone Java CLI tool that compiles a `.java` source file, executes it under the Java Debug Interface (JDI), and produces a complete **Execution Trace** as a JSON file — capturing, at every executed line, the call stack, local variables, and heap object/array state.

## Quick Start

### Prerequisites

- **JDK 17** or later (must be a full JDK, not a JRE)
- The `JAVA_HOME` environment variable must point to the JDK

### Build

```bash
./gradlew shadowJar
```

This produces `build/libs/trace-engine.jar`.

### Run

```bash
java -jar build/libs/trace-engine.jar <source.java> <output-trace.json>
```

**Example:**

```bash
java -jar build/libs/trace-engine.jar src/test/resources/fixtures/Sample.java output/trace.json
```

### Options

| Option | Default | Description |
|---|---|---|
| `--step-limit <N>` | 50000 | Maximum execution steps before watchdog termination |
| `--timeout <seconds>` | 10 | Maximum wall-clock execution time |
| `--log-level <level>` | INFO | Logging verbosity (TRACE, DEBUG, INFO, WARN, ERROR) |

### Run Tests

```bash
./gradlew test
```

## Output Format

The trace is a JSON file with the following structure:

```json
{
  "schemaVersion": "1.0.0",
  "metadata": {
    "generatedAt": "2026-07-15T19:00:00Z",
    "toolVersion": "0.1.0",
    "javaVersion": "17.0.x",
    "sourceFile": "Sample.java",
    "mainClass": "Sample",
    "executionDurationMs": 1234,
    "terminationReason": "normal_exit",
    "totalEvents": 42,
    "totalObjects": 5,
    "totalFrames": 42
  },
  "events": [
    {
      "seq": 0,
      "type": "line",
      "sourceFile": "Sample.java",
      "className": "Sample",
      "methodName": "main",
      "lineNumber": 7,
      "callStack": [...],
      "heap": { "obj_1": {...} }
    }
  ],
  "statistics": {
    "maxCallStackDepth": 3,
    "uniqueMethodsExecuted": 3,
    "loopIterationsDetected": 3,
    "objectsCreated": 4,
    "arraysCreated": 2
  }
}
```

### Event Types

| Type | Description |
|---|---|
| `line` | A normal execution step at a source line |
| `exception` | An uncaught exception terminated execution |

### Value Kinds

| Kind | Example | Description |
|---|---|---|
| `int` | `{"kind":"int","value":42}` | Integer value |
| `long` | `{"kind":"long","value":100000}` | Long value |
| `float` | `{"kind":"float","value":3.14}` | Float value |
| `double` | `{"kind":"double","value":2.718}` | Double value |
| `boolean` | `{"kind":"boolean","value":true}` | Boolean value |
| `char` | `{"kind":"char","value":"A"}` | Character value |
| `string` | `{"kind":"string","value":"hello","objectId":"obj_5"}` | String value with object identity |
| `null` | `{"kind":"null"}` | Null reference |
| `object_ref` | `{"kind":"object_ref","objectId":"obj_3"}` | Reference to an object in the heap |
| `array_ref` | `{"kind":"array_ref","objectId":"obj_2"}` | Reference to an array in the heap |

### Termination Reasons

| Reason | Description |
|---|---|
| `normal_exit` | Program terminated normally |
| `uncaught_exception` | Program threw an uncaught exception |
| `step_cap_exceeded` | Watchdog step limit was reached |
| `timeout` | Watchdog wall-clock timeout was reached |

## Architecture

```
CLI → Compiler → Launcher → JDI Debug Session → Capture Strategy → Trace Builder → Serializer
                                                        ↓
                                                  Runtime Events (DTOs)
                                                        ↓
                                                  Execution Trace (JSON)
```

### Key Design Principles

1. **JDI Isolation:** All JDI imports are confined to the `jdi.capture` package. No JDI type escapes this boundary.
2. **Full Snapshot Mode:** Each event carries a complete heap snapshot of all referenced objects. Simple, correct, debuggable.
3. **Synthetic Object IDs:** JDI's internal object IDs are remapped to stable `"obj_N"` identifiers, enabling future reference visualization.
4. **User Class Filtering:** Only user-defined classes are traced; JDK internals are skipped.
5. **Interface-First Design:** All major components are accessed through interfaces, enabling future engine swaps.

## Sample Program

The primary test fixture (`src/test/resources/fixtures/Sample.java`) exercises:

- Variable creation and update
- Array creation and iteration
- Loop execution (3 iterations)
- Static method call (`square()`)
- Object construction (`new Point()`)
- Field access (`p.x`)

## License

Internal development tool — Execution Studio project.
