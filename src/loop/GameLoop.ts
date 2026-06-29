/**
 * Fixed-timestep game loop driven by requestAnimationFrame.
 *
 * Replaces the Java `Game.start` while-loop + `Display.sync(40)`. The simulation steps at a fixed
 * `dt = 1 / 40` so the original tuned steering constants (maxLinearAcceleration, timeToTarget, ...)
 * keep their behavior regardless of the display's refresh rate. Rendering happens once per animation
 * frame after the simulation has caught up.
 */
export class GameLoop {
  static readonly FPS = 40;
  static readonly DT = 1 / GameLoop.FPS;

  /** Cap on accumulated time per frame, to avoid the "spiral of death" after a long stall. */
  private static readonly MAX_FRAME_TIME = 0.25;

  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private rafId = 0;

  constructor(
    private readonly update: (dt: number) => void,
    private readonly render: () => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private frame = (now: number): void => {
    if (!this.running) return;

    let frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (frameTime > GameLoop.MAX_FRAME_TIME) {
      frameTime = GameLoop.MAX_FRAME_TIME;
    }

    this.accumulator += frameTime;
    while (this.accumulator >= GameLoop.DT) {
      this.update(GameLoop.DT);
      this.accumulator -= GameLoop.DT;
    }

    this.render();
    this.rafId = requestAnimationFrame(this.frame);
  };
}
