# ADR-0007: Immutable Geometry Layout Model

## Status
Accepted

## Context
Rendering reference graphs or local variable cards on a canvas requires calculating 2D visual layouts (applying coordinates positions like force-directed node layouts). If layout engines mutate the visualization model elements directly, the presentation model becomes stateful and hard to share concurrently or cache.

## Decision
We designed `LayoutEngine` as a purely functional calculator. It consumes an immutable `VisualizationModel` and returns a separate `LayoutModel` DTO mapping visual element IDs to `Point2D` coordinates points:
```java
LayoutModel calculateLayout(VisualizationModel model);
```

## Alternatives Considered
- **In-Place Mutation:**
  - *Pros:* Simpler, maps coordinates directly inside variable and node views.
  - *Cons:* Violates model immutability. Makes it impossible to share or cache static model snapshots across threads safely.
  - *Verdict:* Rejected.

## Consequences
- **Pros:**
  - Complete model safety. The core visual snapshots are fully immutable and can be safely shared.
  - Enables decoupling layout engines. Different presentational systems can calculate layouts differently (e.g. mobile vs desktop widescreen) using the same source model.
- **Cons:**
  - Requires looking up coordinate mappings inside the renderer.

## Future Considerations
The immutable layout structure facilitates animating layouts in the frontend (e.g., smoothly transition nodes from coordinate $A$ in step $N$ to coordinate $B$ in step $N+1$).
