# ADR-0004: Stable Synthetic Object Identifiers

## Status
Accepted

## Context
When tracing program execution, a single physical object instance in the JVM memory may persist across multiple steps. JDI identifies objects using temporary session-specific memory pointers (`ObjectReference.uniqueID()`). During serialization and subsequent presentation rendering, we must reliably track and link these object identities (e.g. to draw connections in reference graphs).

## Decision
We implemented a `DefaultObjectRegistry` that translates JDI internal `uniqueID()` keys to synthetic, stable, human-readable strings (`"obj_1"`, `"obj_2"`, etc.). The mappings are registered as the traverser encounters objects on the stack and remain stable for the entire execution trace.

## Alternatives Considered
- **Direct uniqueID Serialization:**
  - *Pros:* Simpler, maps numbers directly.
  - *Cons:* Large, non-deterministic values (e.g., `140737488355328`) that make debugging JSON files extremely difficult.
  - *Verdict:* Rejected.
- **Class-Based Identity Hash Codes:**
  - *Pros:* Standard Java identity hashes.
  - *Cons:* Collision-prone and session-dependent.
  - *Verdict:* Rejected.

## Consequences
- **Pros:**
  - Standardizes identity representation. Trace files are easy for humans to inspect and verify.
  - Enables stable drawing and tracking in presentational renderers.
- **Cons:**
  - Adds registry lookups during object traversal.

## Future Considerations
These synthetic object IDs allow client renderers to maintain stable visual layout nodes during stepping transitions, enabling smooth visual animations (like morphing or highlight highlights).
