import { GameLoop } from "./loop/GameLoop";
import { Camera } from "./render/Camera";
import { Renderer } from "./render/Renderer";
import { drawText } from "./render/shapes";
import { Environment } from "./core/Environment";
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
// Phase 2 static-level demo. The flock comes in Phase 4; for now we just build
// and render a generated level. Keys are a temporary verification aid — the real
// keyboard/game wiring arrives in later phases.
// ---------------------------------------------------------------------------

// Obstacle count per level mirrors the original: level N -> 5*N obstacles.
const TYPE_NAMES = ["Triangle", "Rectangle", "Mixed"] as const;
const COUNTS = [5, 10, 15];

let type: ObstacleType = ObstacleType.Triangle;
let seed = 1;
let manualMode = true;
let showPath = true;
let env = buildEnv();

function buildEnv(): Environment {
  return new Environment(COUNTS[type], type, 0.5, new Rng(seed));
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
    case "m":
    case "M":
      manualMode = !manualMode;
      return;
    default:
      return;
  }
  env = buildEnv();
});

function update(_dt: number): void {
  // Static scene for now.
}

function render(): void {
  renderer.clear();
  renderer.drawEnvironment(env, manualMode, showPath);

  drawText(ctx!, `Free Flying Birds — Phase 2 (static world)`, 12, 22, "white");
  drawText(
    ctx!,
    `type: ${TYPE_NAMES[type]} (${COUNTS[type]})   seed: ${seed}   path: ${showPath ? "on" : "off"}   circles: ${manualMode ? "on" : "off"}`,
    12,
    42,
    "white",
  );
  drawText(ctx!, `keys: 1/2/3 type · R reseed · P path · M flyover circles`, 12, 62, "white");
}

const loop = new GameLoop(update, render);
loop.start();
