# Free Flying Birds

A TypeScript + HTML5 Canvas port of a Java/LWJGL steering & flocking game. You pilot an
(invisible) leader bird; a flock in a dynamic quad formation follows you through procedurally
generated obstacle courses, scoring by passing through the flyover circle above each obstacle.

The original Java/LWJGL 2 version lives at [`../project`](../project) and is kept as reference.
This port preserves the AI core (steering, flocking, formation, path following, obstacle geometry)
as a canvas-free simulation module, with rendering handled separately via the Canvas 2D API.

## Develop

```bash
npm install
npm run dev      # dev server with hot reload
npm run test     # unit tests (Vitest)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## Status

Porting in phases. **Current: Phase 0–1** — project scaffold, fixed-timestep game loop, world→pixel
camera, and the `Vec2` math type (with tests). See the roadmap in the porting plan.

## Layout

- `src/core/` — pure simulation (no canvas, no DOM); unit-testable
- `src/render/` — Canvas rendering (camera, shape helpers, renderer)
- `src/input/` — keyboard handling
- `src/loop/` — fixed-timestep game loop
