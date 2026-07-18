# ADR-0002: Strict JDI Isolation Boundary

## Status
Accepted

## Context
JDI types (`Value`, `ObjectReference`, `StackFrame`, etc.) are live proxies linked to the active thread state of the child target JVM. These proxies become invalid, raise thread access errors, or throw JDI-specific exceptions (e.g. `InvalidStackFrameException`) as soon as the VM is resumed or terminated. Passing these proxy objects outside the capture layer would cause crashes in serializers or timeline navigators.

## Decision
We confined all JDI imports and type variables strictly to the `com.executionstudio.jdi.capture` package. The capture strategy translates raw JDI proxy structures into JDI-free immutable DTO records (`VariableSnapshot`, `FrameSnapshot`, `HeapValue`) immediately at the point of capture during thread suspension.

## Alternatives Considered
- **Lazy Resolution of JDI Values:**
  - *Pros:* Keeps memory footprint low during active execution.
  - *Cons:* Extremely fragile. Triggers crashes if variables are read after the step resumes.
  - *Verdict:* Rejected.
- **Passing JDI Types through Interfaces:**
  - *Pros:* Simpler initial interfaces.
  - *Cons:* Pollutes the entire codebase with JDI classes and exceptions.
  - *Verdict:* Rejected.

## Consequences
- **Pros:**
  - Absolute runtime safety. Once a step is captured, its variables are preserved in standard Java records.
  - Decouples downstream code (serializer, playback player, and renderers) from JDI dependencies.
  - Enables swapping JDI with other capture mechanisms (like bytecode instrumentation) without changing any other component.
- **Cons:**
  - Creates translation overhead (copies JDI values into DTO instances at each step).

## Future Considerations
The JDI isolation boundary enables the platform to compile and execute the Playback Engine and presentation renderers on platforms where JDI is unavailable (e.g. web browsers via webassembly or mobile devices), as they operate entirely on the serialized JDI-free execution model.
