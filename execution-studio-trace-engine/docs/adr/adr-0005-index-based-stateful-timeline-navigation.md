# ADR-0005: Index-Based Stateful Timeline Navigation

## Status
Accepted

## Context
A key requirement of the playback engine is to navigate the execution trace (step forward, step backward, seek, restart). If the navigation pointer (`Timeline`) directly manages or depends on trace model states or event entities, the timeline logic becomes coupled with the data schema, violating separation of concerns.

## Decision
We designed the `Timeline` interface to work strictly with integer indexes (step positions). The timeline manages pointer indexes and bounds limits but has zero knowledge of trace events or the underlying execution models. The `PlaybackEngine` queries the active index from the timeline and passes it to the `ExecutionStateBuilder` to calculate states on demand.

## Alternatives Considered
- **Event-Based Timeline:**
  - *Pros:* Simpler initial stepping implementation.
  - *Cons:* Timeline components must carry event lists and reference schemas, preventing independent testing of stepping logic.
  - *Verdict:* Rejected.

## Consequences
- **Pros:**
  - Complete decoupling. The timeline component can be tested independently of trace serialization models.
  - The playback player can easily manage seeking (e.g. mapping slider percentages to raw index points) without loading model classes.
- **Cons:**
  - Requires the engine to coordinate between the timeline pointer and state builders.

## Future Considerations
The index-based timeline enables easy synchronization with other index-indexed modules, such as source-line mappings or timeline metrics graphs.
