import { GameLoop } from "./loop/GameLoop";
import { Camera } from "./render/Camera";
import { Renderer } from "./render/Renderer";
import { drawText } from "./render/shapes";
import { Environment } from "./core/Environment";
import { DynamicQuadFormation } from "./core/DynamicQuadFormation";
import { Bird } from "./core/Bird";
import { Vec2 } from "./core/Vec2";
import { Rng } from "./core/rng";
import { ObstacleType } from "./core/types";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Canvas element #game not found");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D canvas context not available");
}

const camera = new Camera(canvas.width, canvas.height);
const renderer = new Renderer(ctx, camera);

// ---------------------------------------------------------------------------
// Phase 4 demo: a flock flies the course in AUTOMATIC mode (leader follows the
// flyover path + avoids obstacles; followers hold a dynamic quad formation).
// Manual control, scoring, levels, and the timer arrive in Phase 5. Keys here
// are a temporary verification aid.
// ---------------------------------------------------------------------------

const TYPE_NAMES = ["Triangle", "Rectangle", "Mixed"] as const;
const COUNTS = [5, 10, 15];
const NUM_BIRDS = 10;

let type: ObstacleType = ObstacleType.Triangle;
let seed = 1;
let showPath = false;
let showLeader = true;

let env!: Environment;
let formation!: DynamicQuadFormation;
buildLevel();

function buildLevel(): void {
  const rng = new Rng(seed);
  env = new Environment(COUNTS[type], type, 0.5, rng);
  formation = new DynamicQuadFormation(env);
  for (let i = 0; i < NUM_BIRDS; i++) {
    const b = new Bird();
    b.position = new Vec2(rng.next() * 50, 300 + rng.next() * 50);
    formation.addBird(b);
  }
}

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "1":
      type = ObstacleType.Triangle;
      break;
    case "2":
      type = ObstacleType.Rectangle;
      break;
    case "3":
      type = ObstacleType.Mixed;
      break;
    case "r":
    case "R":
      seed++;
      break;
    case "p":
    case "P":
      showPath = !showPath;
      return;
    case "l":
    case "L":
      showLeader = !showLeader;
      return;
    default:
      return;
  }
  buildLevel();
});

function update(dt: number): void {
  formation.checkHandleHits();
  formation.move(dt);
  const lead = formation.getLeadBird();
  if (lead) {
    for (const obstacle of env.obstacles) {
      obstacle.isCleared(lead.position);
    }
  }
}

function render(): void {
  renderer.clear();
  renderer.drawEnvironment(env, /* manualMode */ true, showPath);
  renderer.drawFlock(formation, showLeader);

  const cleared = env.obstacles.filter((o) => o.hasBeenCleared).length;
  drawText(ctx!, `Free Flying Birds — Phase 4 (automatic flocking)`, 12, 22, "white");
  drawText(
    ctx!,
    `type: ${TYPE_NAMES[type]}   seed: ${seed}   birds: ${formation.birds.length} alive / ${formation.deadBirds.length} lost   cleared: ${cleared}/${env.obstacles.length}`,
    12,
    42,
    "white",
  );
  drawText(ctx!, `keys: 1/2/3 type · R reseed · P path · L leader`, 12, 62, "white");
}

const loop = new GameLoop(update, render);
loop.start();
