import { Vec2 } from "./Vec2";

/**
 * The kinematic state a steering behavior reads and writes. Implemented by `Character`/`Bird`
 * (added in a later phase) and by the lightweight positional targets the algorithms create
 * internally. Decoupling on this interface lets the steering layer exist independently of Character.
 */
export interface Steerable {
  position: Vec2;
  velocity: Vec2;
  orientation: number;
  rotation: number;
  maxSpeed: number;
}
