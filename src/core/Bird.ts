import { Vec2 } from "./Vec2";
import { Character } from "./Character";
import { SteeringAlgorithm } from "./SteeringAlgorithm";
import { YELLOW } from "./Color";
import type { Path } from "./Path";
import type { Obstacle } from "./Obstacle";
import type { Steerable } from "./Steerable";

/**
 * Manual control action for the leader bird. Values match the Java action codes set by
 * handleKeyboard: LEFT key -> 1, RIGHT key -> 2, UP -> 3 (faster), DOWN -> 4 (slower).
 */
export const enum ManualAction {
  None = 0,
  Left = 1,
  Right = 2,
  Faster = 3,
  Slower = 4,
}

/**
 * A bird. Port of Java `Bird`. Adds leader/path-following/keyboard-action behavior on top of the
 * Character kinematics; each behavior delegates to a SteeringAlgorithm and integrates the result.
 */
export class Bird extends Character {
  isLeader = false;
  lengthAlongPath = 0;
  isFreeFly = true;
  manualAction: ManualAction = ManualAction.None;

  readonly floorSpeed = 10;
  readonly ceilSpeed = 60;
  readonly deltaSpeed = 3;
  readonly deltaAngle = (10 * Math.PI) / 180;
  readonly deltaTime = 5;

  constructor() {
    super();
    this.color = YELLOW;
    this.maxSpeed = 30;
    this.orientation = Math.PI / 2;
  }

  /** Follows the flyover path with predictive lookahead (automatic mode). */
  moveAlongPath(timePeriod: number, path: Path): void {
    const algo = new SteeringAlgorithm();
    const steering = algo.followPath(this, path, this.lengthAlongPath);
    this.lengthAlongPath = algo.lengthAlongPath;
    this.update(steering, timePeriod);
  }

  /** Applies the current manual action (turn/speed) for the leader (manual mode). */
  movePerAction(timePeriod: number): void {
    const algo = new SteeringAlgorithm();
    let steering;
    switch (this.manualAction) {
      case ManualAction.Left:
        steering = algo.kinematicSeek(this, this.getTarget(true));
        break;
      case ManualAction.Right:
        steering = algo.kinematicSeek(this, this.getTarget(false));
        break;
      case ManualAction.Faster: {
        const currSpeed = this.maxSpeed;
        this.maxSpeed = Math.min(this.maxSpeed + this.deltaSpeed, this.ceilSpeed);
        this.velocity.multiplyScalar(this.maxSpeed / currSpeed);
        steering = algo.keepGoing(this);
        break;
      }
      case ManualAction.Slower: {
        const currSpeed = this.maxSpeed;
        this.maxSpeed = Math.max(this.maxSpeed - this.deltaSpeed, this.floorSpeed);
        this.velocity.multiplyScalar(this.maxSpeed / currSpeed);
        steering = algo.keepGoing(this);
        break;
      }
      case ManualAction.None:
      default:
        steering = algo.keepGoing(this);
        break;
    }
    this.update(steering, timePeriod);
  }

  /** Follows the leader while separating from and matching the other birds (follower behavior). */
  follow(timePeriod: number, leader: Steerable, birds: Bird[]): void {
    const others: Steerable[] = birds.filter((b) => b !== this);
    const algo = new SteeringAlgorithm();
    const steering = algo.follow(this, leader, others);
    if (steering != null) {
      this.update(steering, timePeriod);
    }
  }

  /** Steers around obstacles if any ray hits one; returns whether avoidance took over. */
  avoidObstacle(timePeriod: number, obstacles: Obstacle[]): boolean {
    const algo = new SteeringAlgorithm();
    const steering = algo.obstacleAvoidance(this, obstacles);
    if (steering != null) {
      this.update(steering, timePeriod);
      return true;
    }
    return false;
  }

  /** A point offset from the current heading by +/- deltaAngle, used to turn left/right. */
  private getTarget(isUp: boolean): Steerable {
    let targetAngle = this.velocity.getAngle();
    targetAngle += isUp ? this.deltaAngle : -this.deltaAngle;
    const targetPosition = Vec2.fromAngle(targetAngle);
    const positionDisplacement = this.velocity.getLength() * this.deltaTime;
    targetPosition.multiplyScalar(positionDisplacement);
    targetPosition.add(this.position);
    return {
      position: targetPosition,
      velocity: new Vec2(0, 0),
      orientation: this.orientation,
      rotation: 0,
      maxSpeed: 0,
    };
  }
}
