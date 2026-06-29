import { Vec2 } from "../core/Vec2";
import type { Environment } from "../core/Environment";
import type { Obstacle } from "../core/Obstacle";
import { Camera } from "./Camera";
import { fillPolygon, strokeCircle, strokePolyline } from "./shapes";

/** Colors matching the original game. */
const COLORS = {
  background: "rgb(204, 0, 0)", // (0.8, 0, 0)
  obstacleUncleared: "rgb(255, 128, 0)", // (1, 0.5, 0)
  obstacleCleared: "rgb(0, 255, 0)", // (0, 1, 0)
  flyoverCircle: "rgb(255, 255, 255)",
  debugPath: "rgba(0, 255, 255, 0.7)",
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
    strokeCircle(this.ctx, center.x, center.y, radius, COLORS.flyoverCircle);
  }

  /** Debug visualization of the flyover path (the original only drew it for debugging). */
  private drawPath(env: Environment): void {
    const path = env.path;
    const points: Vec2[] = [];
    for (let i = 0; i < path.numPoints; i++) {
      points.push(this.camera.toPixel(new Vec2(path.x[i], path.y[i])));
    }
    strokePolyline(this.ctx, points, COLORS.debugPath, 2);
  }
}
