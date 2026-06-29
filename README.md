# Free Flying Birds

A TypeScript + HTML5 Canvas port of a Java/LWJGL steering & flocking game. You pilot an
(invisible) leader bird; a flock of followers trails it through procedurally generated obstacle
courses, scoring by passing through the flyover circle above each obstacle.

The original Java/LWJGL 2 version lives at [`../project`](../project) and is kept as reference.
This port preserves the AI core (steering, flocking, formations, path following, obstacle geometry)
as a canvas-free simulation module, with rendering and input handled separately.

## Play

```bash
npm install
npm run dev      # then open the printed localhost URL and click the page to give it focus
```

- **Three levels**: 5 triangles → 10 rectangles → 15 mixed obstacles. Pass through the white
  flyover circle above each obstacle to clear it (it turns green). Followers that hit an obstacle
  or the ground turn brown and fall. Each level has a 60-second timer and up to three rounds.
- Score = obstacles cleared × level × 5 − followers lost.

### Controls

| Key | Action |
| --- | --- |
| ↑ / ↓ | Speed up / slow down |
| ← / → | Turn left / right |
| `A` | Automatic mode (the flock flies the path itself) |
| `M` | Manual mode (you fly) |
| `F` | Cycle follower formation (Quad → Vee → Line) |
| `N` | Skip to the next level |
| `D` | Toggle debug overlay (flyover path, leader, velocity vectors) |
| `R` | Restart (new random course) |

## Develop

```bash
npm run test     # unit tests (Vitest)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## Layout

- `src/core/` — pure simulation (no canvas, no DOM); unit-tested
  - `Vec2`, `SteeringAlgorithm`, `SteeringOutput`, `Steerable`
  - `Character` → `Bird`, `Formation` → `SlotFormation` → `DynamicQuadFormation` / `VeeFormation` /
    `LineFormation`
  - `Obstacle`, `ObstacleSeries`, `Environment`, `Path`, `rng`, `GameBirds`
- `src/render/` — Canvas rendering (`Camera`, `shapes`, `Renderer`)
- `src/input/` — `Keyboard`
- `src/loop/` — fixed-timestep `GameLoop` (dt = 1/40)

Adding a formation: extend `SlotFormation` and implement `slotOffsets(numFollowers)` (local offsets,
x = distance behind the leader, y = sideways), then register it in `core/formations.ts` and
`FormationType`.

## Deploy (GitHub Pages)

A workflow at `.github/workflows/deploy.yml` builds and publishes `dist/` on every push to `main`.

1. Create a GitHub repo named **`free-flying-birds`** (the name must match `REPO_BASE` in
   `vite.config.ts`; update it there if you use a different name).
2. `git remote add origin <url>` and `git push -u origin main`.
3. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The site publishes at `https://<user>.github.io/free-flying-birds/`.

## License

[MIT](LICENSE) © 2026 Asser Tantawi
