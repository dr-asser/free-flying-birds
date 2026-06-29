import { GameLoop } from "./loop/GameLoop";
import { Camera } from "./render/Camera";
import { Renderer } from "./render/Renderer";
import { drawText } from "./render/shapes";
import { Keyboard } from "./input/Keyboard";
import { GameBirds } from "./core/GameBirds";
import { ManualAction } from "./core/Bird";

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
const keyboard = new Keyboard();

// The game starts in manual mode (player controls the invisible leader). A toggles automatic
// (the flock flies the path itself), M returns to manual, R restarts from level 1.
let seed = 1;
let game = new GameBirds(seed);

keyboard.onPress("KeyA", () => game.setManualMode(false));
keyboard.onPress("KeyM", () => game.setManualMode(true));
keyboard.onPress("KeyR", () => {
  seed++;
  game = new GameBirds(seed);
});

/** Translates the held arrow keys into a leader action (left takes priority, as in the original). */
function leaderAction(): ManualAction {
  if (keyboard.isDown("ArrowLeft")) return ManualAction.Left;
  if (keyboard.isDown("ArrowRight")) return ManualAction.Right;
  if (keyboard.isDown("ArrowUp")) return ManualAction.Faster;
  if (keyboard.isDown("ArrowDown")) return ManualAction.Slower;
  return ManualAction.None;
}

function update(dt: number): void {
  if (game.gameEnded) {
    return;
  }
  game.setLeaderAction(leaderAction());
  game.update(dt);
}

function render(): void {
  renderer.clear();
  renderer.drawEnvironment(game.env, game.manualMode);
  // Leader is the invisible player; followers and dead birds are drawn.
  renderer.drawFlock(game.formation, /* showLeader */ false);
  renderer.drawHud(game);

  drawText(
    ctx!,
    `arrows: steer / speed · A automatic · M manual · R restart`,
    12,
    canvas!.height - 14,
    "rgba(255,255,255,0.7)",
  );
}

const loop = new GameLoop(update, render);
loop.start();
