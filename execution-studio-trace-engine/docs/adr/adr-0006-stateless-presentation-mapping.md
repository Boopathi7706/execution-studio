# ADR-0006: Stateless Presentation Mapping

## Status
Accepted

## Context
Client presentational layers (like React) require highly structured visual parameters, such as tracking variable changes (whether a variable's value updated between steps) and reference graph structures. Originally, a stateful session-based mapper (`VisualizationSession`) was proposed. However, maintaining duplicate state history in two different sessions (playback and visualization) introduces cache-invalidation risks and complexity.

## Decision
We chose a purely functional and stateless mapping pipeline. The `VisualizationMapper` accepts the current step state and the previous step state:
```java
VisualizationModel map(ExecutionState state, ExecutionState previousState, boolean isLastStep);
```
It computes variable changes dynamically on-the-fly and converts the raw runtime states into clean visual DTO structures.

## Alternatives Considered
- **Stateful VisualizationSession:**
  - *Pros:* Simpler signature since it only takes the current state.
  - *Cons:* Must cache variable states internally. Fails or produces incorrect change flags if the user performs non-linear actions (like seeking backwards).
  - *Verdict:* Rejected.

## Consequences
- **Pros:**
  - Guaranteed correctness. Seeking backwards or jumping to arbitrary steps naturally resolves correct change tracking by comparing the target step with its preceding step in the playback log.
  - Extremely simple to test. The mapper remains stateless and fully deterministic.
- **Cons:**
  - Requires the client orchestrator to provide both the current and previous states.

## Future Considerations
The stateless mapper is perfectly suited for stateless rendering frameworks like React, which render views purely as a function of the incoming model data.
