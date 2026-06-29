import { Vec2 } from "../core/Vec2";
import type { Environment } from "../core/Environment";
import type { Obstacle } from "../core/Obstacle";
import type { Character } from "../core/Character";
import type { Formation } from "../core/Formation";
import type { Color } from "../core/Color";
import type { GameBirds } from "../core/GameBirds";
import { FORMATION_NAMES } from "../core/formations";
import { Camera } from "./Camera";
import { drawText, fillCircle, fillPolygon, strokeCircle, strokePolyline } from "./shapes";

/** Converts a 0..1 RGB color to a CSS rgb() string. */
function colorToCss(c: Color): string {
  return `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
}

/** Colors matching the original game. */
const COLORS = {
  background: "rgb(56, 128, 200)", // deeper sky blue (was red rgb(204,0,0) in the original)
  obstacleUncleared: "rgb(255, 128, 0)", // (1, 0.5, 0)
  obstacleCleared: "rgb(0, 255, 0)", // (0, 1, 0)
  flyoverCircle: "rgb(255, 255, 255)",
  flyoverCircleHalo: "rgba(0, 0, 80, 0.9)", // dark outline so white circles read on sky blue
  debug: "rgba(170, 0, 170, 0.85)", // magenta: high contrast on sky/obstacles, distinct from HUD
} as const;

/**
 * Draws the game world to a 2D canvas, reading state from the simulation. All world->pixel
 * conversion goes through the Camera. Replaces the scattered `draw()` methods of the Java classes.
 */
export class Renderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly camera: Camera,
  ) {}

  clear(): void {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  /** Draws obstacles and, in manual mode, the flyover circle above each uncleared obstacle. */
  drawEnvironment(env: Environment, manualMode: boolean, debugPath = false): void {
    if (debugPath) {
      this.drawPath(env);
    }
    for (const obstacle of env.obstacles) {
      this.drawObstacle(obstacle);
      if (manualMode && !obstacle.hasBeenCleared) {
        this.drawFlyoverCircle(obstacle);
      }
    }
  }

  private drawObstacle(obstacle: Obstacle): void {
    const points: Vec2[] = [];
    for (let i = 0; i < obstacle.numPoints; i++) {
      points.push(this.camera.toPixel(new Vec2(obstacle.x[i], obstacle.y[i])));
    }
    const color = obstacle.hasBeenCleared ? COLORS.obstacleCleared : COLORS.obstacleUncleared;
    fillPolygon(this.ctx, points, color);
  }

  private drawFlyoverCircle(obstacle: Obstacle): void {
    const center = this.camera.toPixel(
      new Vec2(obstacle.flyoverPoint[0], obstacle.flyoverPoint[1]),
    );
    const radius = this.camera.scaleX(obstacle.acceptedRange);
    // Dark halo first, then the white ring on top, so it stays crisp against the sky.
    strokeCircle(this.ctx, center.x, center.y, radius, COLORS.flyoverCircleHalo, 3);
    strokeCircle(this.ctx, center.x, center.y, radius, COLORS.flyoverCircle, 1.5);
  }

  /**
   * Draws the flock: followers and dead birds always, the (normally invisible) leader only when
   * `showLeader` is set. Mirrors the original Formation.draw, which never drew the leader.
   */
  drawFlock(formation: Formation, showLeader = false): void {
    for (const bird of formation.birds) {
      if (showLeader || !bird.isLeader) {
        this.drawCharacter(bird);
      }
    }
    for (const bird of formation.deadBirds) {
      this.drawCharacter(bird);
    }
  }

  /** Draws a character as a filled circle with a triangular heading indicator. */
  private drawCharacter(c: Character): void {
    const center = this.camera.toPixel(c.position);
    const radius = this.camera.scaleX(c.radius);
    const css = colorToCss(c.color);
    fillCircle(this.ctx, center.x, center.y, radius, css);

    // Orientation triangle (vertices computed in world space, then projected).
    const rsin = c.radius * Math.sin(c.orientation);
    const rcos = c.radius * Math.cos(c.orientation);
    const tri = [
      new Vec2(c.position.x + 2 * rsin, c.position.y + 2 * rcos),
      new Vec2(c.position.x - rcos, c.position.y + rsin),
      new Vec2(c.position.x + rcos, c.position.y - rsin),
    ].map((p) => this.camera.toPixel(p));
    fillPolygon(this.ctx, tri, css);
  }

  /** Draws the heads-up display: level/time on the left, score/total on the right, mode/win text. */
  drawHud(game: GameBirds): void {
    const w = this.ctx.canvas.width;
    const boardColor = "rgb(0, 0, 102)"; // (0, 0, 0.4)

    // Left board: level + time remaining.
    this.ctx.fillStyle = boardColor;
    this.ctx.fillRect(20, 80, 150, 56);
    drawText(this.ctx, `level   ${game.gameLevel}`, 34, 104, "white");
    const timeLeft = Math.max(0, Math.trunc(game.endTime - game.currTime));
    drawText(this.ctx, `time    ${timeLeft}`, 34, 124, "rgb(255,255,0)");

    // Right board: score + total.
    this.ctx.fillStyle = boardColor;
    this.ctx.fillRect(w - 170, 80, 150, 56);
    drawText(this.ctx, `score   ${Math.trunc(game.score)}`, w - 156, 104, "white");
    drawText(this.ctx, `total   ${game.totalScore}`, w - 156, 124, "white");

    // Center: automatic-mode indicator.
    if (!game.manualMode) {
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(w / 2 - 55, 80, 110, 24);
      drawText(this.ctx, "Automatic", w / 2 - 38, 97, "black");
    }

    drawText(this.ctx, `formation: ${FORMATION_NAMES[game.formationType]}`, 34, 152, "white");

    if (game.gameEnded) {
      drawText(this.ctx, "You Win!", w / 2 - 40, 200, "rgb(0, 0, 90)", "28px monospace");
    }
  }

  /** Debug overlay: the flyover path and each bird's velocity vector. Pair with showLeader=true. */
  drawDebug(game: GameBirds): void {
    this.drawPath(game.env);
    for (const bird of game.formation.birds) {
      const from = this.camera.toPixel(bird.position);
      const to = this.camera.toPixel(Vec2.copy(bird.position).add(bird.velocity));
      strokePolyline(this.ctx, [from, to], COLORS.debug, 1.5);
    }
  }

  /** Debug visualization of the flyover path (the original only drew it for debugging). */
  private drawPath(env: Environment): void {
    const path = env.path;
    const points: Vec2[] = [];
    for (let i = 0; i < path.numPoints; i++) {
      points.push(this.camera.toPixel(new Vec2(path.x[i], path.y[i])));
    }
    strokePolyline(this.ctx, points, COLORS.debug, 2);
  }
}
