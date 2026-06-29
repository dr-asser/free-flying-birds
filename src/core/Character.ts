import { Vec2 } from "./Vec2";
import { World } from "./world";
import type { Color } from "./Color";
import { WHITE } from "./Color";
import type { Steerable } from "./Steerable";
import type { SteeringOutput } from "./SteeringOutput";

/**
 * A movable agent with kinematic state. Port of Java `Character`.
 *
 * `update` integrates a SteeringOutput over a timestep (velocity from the steering plus its linear
 * acceleration, clamped to maxSpeed; orientation/rotation from the angular terms), then clamps to
 * the world bounds. The Java `game` reference is gone — boundary limits read from `World`, and the
 * dead `clone()` (only used by the removed pursue/evade behaviors) is dropped. Drawing lives in the
 * render layer.
 */
export class Character implements Steerable {
  position = new Vec2(0, 0);
  orientation = 0;
  velocity = new Vec2(0, 0); // change in position over time
  rotation = 0; // change in orientation over time

  radius = 5;
  color: Color = WHITE;
  maxSpeed = 0;
  isFixed = false;
  label = "";

  /** Integrates a steering output over `time` seconds. No-op for a null steering. */
  update(steering: SteeringOutput | null, time: number): void {
    if (steering == null) {
      return;
    }
    this.velocity = Vec2.copy(steering.velocity);
    const tempAcceleration = Vec2.copy(steering.linearAcceleration);
    this.velocity.add(tempAcceleration.multiplyScalar(time));

    // limit to maxSpeed
    if (this.velocity.getLength() > this.maxSpeed) {
      this.velocity.normalize();
      this.velocity.multiplyScalar(this.maxSpeed);
    }

    const temp = Vec2.copy(this.velocity);
    this.position.add(temp.multiplyScalar(time));
    this.orientation += steering.rotation * time;
    this.rotation += steering.angularAcceleration * time;
    this.limitBoundaries();
  }

  /** Keeps the character within the window bounds (not the visible rect), as in the original. */
  limitBoundaries(): void {
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.y < 0) this.position.y = 0;
    if (this.position.x > World.WIDTH) this.position.x = World.WIDTH;
    if (this.position.y > World.HEIGHT) this.position.y = World.HEIGHT;
  }
}
