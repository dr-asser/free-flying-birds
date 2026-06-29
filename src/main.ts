import { GameLoop } from "./loop/GameLoop";
import { Camera } from "./render/Camera";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('Canvas element #game not found');
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D canvas context not available");
}

// Will drive rendering of the world in later phases.
const camera = new Camera(canvas.width, canvas.height);
void camera;

// Original LWJGL initial background was (0.8, 0, 0).
const BACKGROUND = "rgb(204, 0, 0)";

let ticks = 0;

function update(_dt: number): void {
  ticks++;
}

function render(): void {
  ctx!.fillStyle = BACKGROUND;
  ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

  // Temporary Phase 0 liveness indicator: confirms the fixed-timestep loop is running.
  ctx!.fillStyle = "white";
  ctx!.font = "14px monospace";
  ctx!.fillText(`ticks: ${ticks}`, 12, 22);
}

const loop = new GameLoop(update, render);
loop.start();
