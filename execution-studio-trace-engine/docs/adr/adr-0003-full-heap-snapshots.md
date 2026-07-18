# ADR-0003: Full Heap Snapshots per Execution Step

## Status
Accepted

## Context
When replaying execution steps in a timeline player, the visualizer needs to render the state of all heap variables. Reconstructing this state at any step index $N$ must be fast and reliable, especially when scrubbing backwards or seeking to arbitrary checkpoints.

## Decision
We chose to capture a complete snapshot of all heap objects reachable from the active stack frames at each step (Full Heap Snapshot Mode). Each `TraceEvent` serialized to JSON contains a complete copy of the visible stack and heap at that line.

## Alternatives Considered
- **Delta/Diff Encoding:**
  - *Pros:* Significantly smaller JSON files on disk (~10x to 50x compression).
  - *Cons:* Reconstructing the state at step $N$ requires sequentially replaying all steps from 0 to $N$, resulting in slow $O(N)$ seek times.
  - *Verdict:* Deferred.
- **On-Demand Capturing (No Pre-Calculated Heap):**
  - *Pros:* Faster initial runs.
  - *Cons:* Requires keeping the JVM alive during playback.
  - *Verdict:* Rejected (violates the requirement to playback JDI-free).

## Consequences
- **Pros:**
  - Fast arbitrary seeking. Reconstructing state at step $N$ takes $O(1)$ constant time.
  - Simple, robust, and highly debuggable trace models.
  - The playback player doesn't need to maintain running execution history state machines.
- **Cons:**
  - Large JSON file size. Large arrays or objects graphs create redundant copies across steps.

## Future Considerations
The trace engine interfaces (`TraceBuilder` and `ExecutionStateBuilder`) abstract this choice. If file size becomes an issue, we can implement a `DeltaTraceBuilder` and a `DeltaExecutionStateBuilder` that perform in-memory caching to reconstruct states efficiently without modifying the public interfaces.
