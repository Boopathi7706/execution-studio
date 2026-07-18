# ADR-0001: Programmatic Step Tracing via JVM Debug Interface (JDI)

## Status
Accepted

## Context
In Spike 01, we needed a reliable mechanism to extract line-level execution trace data (call stack frames, local variables, object heap layouts) from running Java programs. The extraction mechanism must work programmatically, require minimal developer setup, and capture data deterministically on a step-by-step basis.

## Decision
We chose to implement programmatic execution tracing using the Java Debug Interface (JDI) module (`jdk.jdi` / `com.sun.jdi`). The engine programmatically launches the debuggee process via JDI's `LaunchingConnector`, configures class preparation breakpoints, and steps line-by-line (`STEP_LINE`, `STEP_INTO`) through the code, querying variable tables and the JVM heap at each step.

## Alternatives Considered
- **Bytecode Instrumentation (ASM / ByteBuddy):**
  - *Pros:* Extremely high execution performance (~100x faster than JDI stepping).
  - *Cons:* Significantly higher complexity, requires injecting capture logic directly into stack frames, and risks polluting the debuggee class namespace.
  - *Verdict:* Deferred. Over-engineered for a feasibility spike.
- **Source Code Instrumentation:**
  - *Pros:* Simple to generate statements logger calls.
  - *Cons:* Fragile, fails on compound lines, fails on third-party libraries, and does not capture memory object values cleanly.
  - *Verdict:* Rejected. Not viable for a production-grade visualization tool.

## Consequences
- **Pros:**
  - Standard API shipping by default in Java JDKs (no external library dependencies).
  - Provides reliable stack frame and local variable table access out of the box.
  - VM suspension allows safe, deterministic capture of the entire state at the line hit.
- **Cons:**
  - Stepping is slow (~1ms to 5ms per step) due to JDI socket communication overhead.
  - Limits execution tracing to smaller, educational or algorithmic Java programs.

## Future Considerations
As the tool moves from algorithmic tracing to production scale, we can introduce a hybrid model:
1. Use bytecode instrumentation to log line hits and basic primitive values rapidly.
2. Fall back to JDI only when deep heap analysis or time-travel debugger attachment is requested.
