import { Vec2 } from "./Vec2";
import { SteeringOutput } from "./SteeringOutput";
import type { Steerable } from "./Steerable";
import type { Obstacle } from "./Obstacle";
import type { Path } from "./Path";

/**
 * The steering behaviors the game actually uses. Port of the live parts of Java `SteeringAlgorithm`.
 *
 * Two intentional changes from the original:
 *  - The embedded debug rendering (glColor/drawString/line-loops sprinkled inside the algorithms)
 *    is removed; these functions are now pure and return only a SteeringOutput.
 *  - The behaviors never wired into gameplay are dropped (kinematicWander, dynamicWander,
 *    kinematicFlee, kinematicSeekWithArrival, dynamicFlee, dynamicSeekWithArrival, pursue, evade,
 *    lookWhereYoureGoing). They remain in the Java reference if ever needed; re-add as needed.
 *
 * Tuning constants are preserved exactly, since they were tuned to the fixed dt = 1/40 timestep.
 */
export class SteeringAlgorithm {
  readonly closeRadius = 15;
  readonly slowRadius = 40;
  readonly timeToTarget = 0.08;
  readonly maxLinearAcceleration = 100;
  readonly maxAngularAcceleration = 40;
  readonly maxAngularRotation = 1;
  readonly slowAngularRadius = 0.5;
  readonly closeAngularRadius = 0.05;
  readonly pathPredictTime = 0.08;
  readonly pathOffset = 15;
  readonly separationThreshold = 90;
  readonly separationDecayCoefficient = 1000;
  readonly obstacleRayLength = 15;
  readonly obstacleClearance = 20;
  readonly raySideAngle = 0.05;

  /** Set by followPath, read back by the caller to persist progress along the path. */
  lengthAlongPath = 0;

  /** Orientation implied by a velocity (y-down), or the current orientation if not moving. */
  getKinematicOrientation(currOrientation: number, velocity: Vec2): number {
    if (velocity.getLength() > 0) {
      return Math.atan2(-velocity.y, velocity.x) + Math.PI / 2;
    }
    return currOrientation;
  }

  /** Keep current velocity/rotation (no steering). */
  keepGoing(character: Steerable): SteeringOutput {
    const steering = new SteeringOutput();
    steering.velocity = Vec2.copy(character.velocity);
    steering.rotation = character.rotation;
    return steering;
  }

  /** Move directly toward the target at max speed (kinematic). */
  kinematicSeek(character: Steerable, target: Steerable): SteeringOutput {
    const steering = new SteeringOutput();
    steering.velocity = Vec2.copy(target.position).subtract(character.position);
    steering.velocity.normalize();
    steering.velocity.multiplyScalar(character.maxSpeed);
    steering.rotation = 0;
    character.orientation = this.getKinematicOrientation(character.orientation, steering.velocity);
    return steering;
  }

  /** Accelerate toward the target (dynamic). */
  dynamicSeek(character: Steerable, target: Steerable): SteeringOutput {
    const steering = new SteeringOutput();
    steering.linearAcceleration = Vec2.copy(target.position).subtract(character.position);
    steering.linearAcceleration.normalize();
    steering.linearAcceleration.multiplyScalar(this.maxLinearAcceleration);
    steering.angularAcceleration = 0;
    steering.velocity = Vec2.copy(character.velocity);
    steering.rotation = character.rotation;
    return steering;
  }

  /** Follow a path with predictive lookahead: seek a point slightly ahead along the path. */
  followPath(character: Steerable, path: Path, length: number): SteeringOutput {
    const futurePosition = Vec2.copy(character.velocity)
      .multiplyScalar(this.pathPredictTime)
      .add(character.position);
    this.lengthAlongPath = path.getLengthAlongPath(futurePosition, length);
    this.lengthAlongPath += this.pathOffset;
    const targetPosition = path.getPosition(this.lengthAlongPath);
    const target = SteeringAlgorithm.positionalTarget(
      targetPosition,
      character.orientation,
      character.maxSpeed,
    );

    const steering = this.dynamicSeek(character, target);
    steering.angularAcceleration = this.face(character, target);
    return steering;
  }

  /** Match the target's velocity (dynamic). */
  velocityMatch(character: Steerable, target: Steerable): SteeringOutput {
    const steering = new SteeringOutput();
    const vector = Vec2.copy(target.velocity)
      .subtract(character.velocity)
      .multiplyScalar(1 / this.timeToTarget);
    if (vector.getLength() > this.maxLinearAcceleration) {
      vector.normalize();
      vector.multiplyScalar(this.maxLinearAcceleration);
    }
    steering.linearAcceleration = Vec2.copy(vector);
    steering.angularAcceleration = 0;
    steering.velocity = Vec2.copy(character.velocity);
    steering.rotation = character.rotation;
    return steering;
  }

  /** Steer away from nearby targets, more strongly the closer they are. */
  separation(character: Steerable, targets: Steerable[]): SteeringOutput {
    const steering = new SteeringOutput();
    for (const target of targets) {
      const direction = Vec2.copy(character.position).subtract(target.position);
      const distance = direction.getLength();
      if (distance < this.separationThreshold) {
        let strength = this.maxLinearAcceleration;
        if (distance > 0) {
          strength = Math.min(
            this.separationDecayCoefficient / (distance * distance),
            this.maxLinearAcceleration,
          );
        }
        direction.normalize();
        steering.linearAcceleration.add(direction.multiplyScalar(strength));
      }
    }
    steering.angularAcceleration = 0;
    steering.velocity = Vec2.copy(character.velocity);
    steering.rotation = character.rotation;
    return steering;
  }

  /** Blend several outputs by weight, clamping the result to the acceleration limits. */
  weightedBlending(
    outputs: (SteeringOutput | null)[],
    weights: number[],
  ): SteeringOutput | null {
    const weightedSteering = new SteeringOutput();
    let areAllNull = true;
    for (const output of outputs) {
      if (output != null) {
        areAllNull = false;
        weightedSteering.velocity = Vec2.copy(output.velocity);
        weightedSteering.rotation = output.rotation;
        break;
      }
    }
    if (areAllNull) {
      return null;
    }

    for (let j = 0; j < outputs.length; j++) {
      const output = outputs[j];
      if (output != null) {
        weightedSteering.addWeighted(output, weights[j]);
      }
    }
    if (weightedSteering.linearAcceleration.getLength() > this.maxLinearAcceleration) {
      weightedSteering.linearAcceleration.normalize();
      weightedSteering.linearAcceleration.multiplyScalar(this.maxLinearAcceleration);
    }
    if (weightedSteering.angularAcceleration > this.maxAngularAcceleration) {
      weightedSteering.angularAcceleration = this.maxAngularAcceleration;
    }
    return weightedSteering;
  }

  /** Follower behavior: blend separation, velocity match, and seek-toward-leader. */
  follow(character: Steerable, leader: Steerable, others: Steerable[]): SteeringOutput | null {
    const steering: (SteeringOutput | null)[] = new Array(3);
    steering[0] = this.separation(character, others);
    steering[1] = this.velocityMatch(character, leader);
    steering[2] = this.dynamicSeek(character, leader);
    steering[2].angularAcceleration = this.align(character, leader);

    const weights = [5, 1, 10];
    return this.weightedBlending(steering, weights);
  }

  /**
   * Three-ray obstacle avoidance: cast a center ray and two shorter side rays; if any hits an
   * obstacle, seek the side target nearest the character to steer around the closest threat.
   */
  obstacleAvoidance(character: Steerable, obstacles: Obstacle[]): SteeringOutput | null {
    const characterPosition = Vec2.copy(character.position);
    const characterAngle = character.velocity.getAngle();

    let closestDistance = Number.MAX_VALUE;
    let closestTargetPosition: Vec2 | null = null;

    for (const obstacle of obstacles) {
      for (let j = 0; j < 3; j++) {
        let rayLength = this.obstacleRayLength;
        if (j === 0 || j === 2) {
          rayLength /= 2;
        }
        const rayAngle = characterAngle + (j - 1) * this.raySideAngle;
        const rayEnd = Vec2.fromAngle(rayAngle).multiplyScalar(rayLength).add(characterPosition);

        const interceptPoint = obstacle.findIntercept(characterPosition, rayEnd);
        if (interceptPoint != null) {
          const targetPosition = obstacle.GetTarget(character, this.obstacleClearance);
          const distance = Vec2.copy(character.position).subtract(targetPosition).getLength();
          if (distance < closestDistance) {
            closestDistance = distance;
            closestTargetPosition = targetPosition;
          }
        }
      }
    }
    if (closestTargetPosition != null) {
      const target = SteeringAlgorithm.positionalTarget(closestTargetPosition, 0, 0);
      return this.kinematicSeek(character, target);
    }
    return null;
  }

  /** Angular acceleration to rotate the character's orientation toward the target's. */
  align(character: Steerable, target: Steerable): number {
    let rotation = target.orientation - character.orientation;
    rotation = this.mapToRange(rotation);
    const rotationSize = Math.abs(rotation);
    if (rotationSize < this.closeAngularRadius) {
      return 0;
    }
    let targetRotation =
      rotationSize > this.slowAngularRadius
        ? this.maxAngularRotation
        : (this.maxAngularRotation * rotationSize) / this.slowAngularRadius;
    targetRotation *= rotation / rotationSize;

    let angularAcceleration = (targetRotation - character.rotation) / this.timeToTarget;
    const absAngularAcceleration = Math.abs(angularAcceleration);
    if (absAngularAcceleration > this.maxAngularAcceleration) {
      angularAcceleration = (angularAcceleration / absAngularAcceleration) * this.maxAngularAcceleration;
    }
    return angularAcceleration;
  }

  /** Angular acceleration to turn the character to face toward the target's position. */
  face(character: Steerable, target: Steerable): number {
    const direction = Vec2.copy(target.position).subtract(character.position);
    if (direction.getLength() === 0) {
      return 0;
    }
    const targetOrientation = Math.atan2(-direction.y, direction.x) + Math.PI / 2;
    let rotation = targetOrientation - character.orientation;
    rotation = this.mapToRange(rotation);
    const rotationSize = Math.abs(rotation);
    if (rotationSize < this.closeAngularRadius) {
      return 0;
    }
    let targetRotation =
      rotationSize > this.slowAngularRadius
        ? this.maxAngularRotation
        : (this.maxAngularRotation * rotationSize) / this.slowAngularRadius;
    targetRotation *= rotation / rotationSize;

    let angularAcceleration = (targetRotation - character.rotation) / this.timeToTarget;
    const absAngularAcceleration = Math.abs(angularAcceleration);
    if (absAngularAcceleration > this.maxAngularAcceleration) {
      angularAcceleration = (angularAcceleration / absAngularAcceleration) * this.maxAngularAcceleration;
    }
    return angularAcceleration;
  }

  /** Maps any angle into (-PI, PI]. */
  mapToRange(theta: number): number {
    if (theta > -Math.PI && theta <= Math.PI) {
      return theta;
    }
    if (theta <= -Math.PI) {
      return this.mapToRange(theta + 2 * Math.PI);
    }
    return this.mapToRange(theta - 2 * Math.PI);
  }

  /** A lightweight position/orientation holder used as a steering target. */
  private static positionalTarget(position: Vec2, orientation: number, maxSpeed: number): Steerable {
    return { position, velocity: new Vec2(0, 0), orientation, rotation: 0, maxSpeed };
  }
}
