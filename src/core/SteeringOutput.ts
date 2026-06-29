import { Vec2 } from "./Vec2";

/**
 * The result of a steering behavior: a desired velocity/rotation (kinematic) plus a linear/angular
 * acceleration (dynamic). Port of Java `SteeringOutput`. `Character.update` integrates these.
 */
export class SteeringOutput {
  velocity: Vec2;
  rotation: number;
  linearAcceleration: Vec2;
  angularAcceleration: number;

  constructor() {
    this.velocity = new Vec2(0, 0);
    this.rotation = 0;
    this.linearAcceleration = new Vec2(0, 0);
    this.angularAcceleration = 0;
  }

  /** Accumulates another output's accelerations scaled by `weight` (used by weighted blending). */
  addWeighted(other: SteeringOutput, weight: number): void {
    const vector = Vec2.copy(other.linearAcceleration).multiplyScalar(weight);
    this.linearAcceleration.add(vector);
    this.angularAcceleration += other.angularAcceleration * weight;
  }
}
