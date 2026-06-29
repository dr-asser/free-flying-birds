import { Vec2 } from "../core/Vec2";

/**
 * World -> canvas-pixel transform. Replaces the original `glOrtho(100, 1100, 550, 50, 1, -1)`.
 *
 * The Java game ran in a 1200x600 window and mapped the visible world rectangle
 * x in [100, 1100], y in [50, 550] onto the full viewport. Canvas is already y-down with the
 * origin at the top-left, so the world's y-down convention carries over with no flip.
 *
 * World coordinates outside the visible rectangle are still valid (birds spawn off-screen and are
 * clamped to the 1200x600 window bounds, not the visible rect) — matching the original behavior.
 */
export class Camera {
  // Visible world rectangle (matches glOrtho left/right/top/bottom).
  static readonly WORLD_LEFT = 100;
  static readonly WORLD_RIGHT = 1100;
  static readonly WORLD_TOP = 50;
  static readonly WORLD_BOTTOM = 550;

  // Full game-world / window bounds (used for boundary clamping elsewhere).
  static readonly GAME_WIDTH = 1200;
  static readonly GAME_HEIGHT = 600;

  private readonly worldWidth = Camera.WORLD_RIGHT - Camera.WORLD_LEFT;
  private readonly worldHeight = Camera.WORLD_BOTTOM - Camera.WORLD_TOP;

  constructor(
    private readonly canvasWidth: number,
    private readonly canvasHeight: number,
  ) {}

  /** World position -> pixel position on the canvas. */
  toPixel(world: Vec2): Vec2 {
    return new Vec2(this.toPixelX(world.x), this.toPixelY(world.y));
  }

  toPixelX(worldX: number): number {
    return ((worldX - Camera.WORLD_LEFT) / this.worldWidth) * this.canvasWidth;
  }

  toPixelY(worldY: number): number {
    return ((worldY - Camera.WORLD_TOP) / this.worldHeight) * this.canvasHeight;
  }

  /** Scale a world-space length to pixels (x and y scales differ if aspect isn't preserved). */
  scaleX(worldLength: number): number {
    return (worldLength / this.worldWidth) * this.canvasWidth;
  }

  scaleY(worldLength: number): number {
    return (worldLength / this.worldHeight) * this.canvasHeight;
  }
}
