import { Vec2 } from "./Vec2";
import { Bird } from "./Bird";
import { World } from "./world";
import { RED, BROWN } from "./Color";
import type { Environment } from "./Environment";
import type { Obstacle } from "./Obstacle";
import type { Path } from "./Path";

/**
 * A flock of birds led by a leader, plus the birds that have been destroyed (and fall to the
 * ground). Port of Java `Formation`. Handles membership/leadership, obstacle/ground hit detection,
 * and the base "everyone follows the path" movement (overridden by DynamicQuadFormation). Drawing
 * lives in the render layer.
 */
export class Formation {
  birds: Bird[] = [];
  deadBirds: Bird[] = [];
  path: Path;
  obstacles: Obstacle[];
  readonly followerSpeedFactor = 1.2;

  constructor(env: Environment) {
    this.path = env.path;
    this.obstacles = env.obstacles;
  }

  /** Adds a bird. The first becomes the (red) leader; later birds fly slightly faster. */
  addBird(b: Bird): boolean {
    if (this.birds.length === 0) {
      b.isLeader = true;
      b.color = RED;
    } else {
      b.maxSpeed *= this.followerSpeedFactor;
    }
    this.birds.push(b);
    return true;
  }

  /** Removes a bird; if it was the leader, promotes the next bird to leader. */
  removeBird(b: Bird): boolean {
    const index = this.birds.indexOf(b);
    if (index === -1) {
      return false;
    }
    this.birds.splice(index, 1);
    if (b.isLeader && this.birds.length > 0) {
      const newLeader = this.birds[0];
      newLeader.isLeader = true;
      newLeader.color = b.color;
      newLeader.lengthAlongPath = b.lengthAlongPath;
    }
    return true;
  }

  /** Base movement: every bird avoids obstacles or follows the path. */
  move(timePeriod: number): void {
    for (const b of this.birds) {
      if (!b.avoidObstacle(timePeriod, this.obstacles)) {
        b.moveAlongPath(timePeriod, this.path);
      }
    }
  }

  /** Dead birds drift straight down to the bottom of the screen. */
  moveDeadBirds(timePeriod: number): void {
    for (const b of this.deadBirds) {
      const target = new Bird();
      target.position = new Vec2(b.position.x, World.HEIGHT);
      target.orientation = 0;
      b.follow(timePeriod, target, []);
    }
  }

  getLeadBird(): Bird | null {
    for (const bird of this.birds) {
      if (bird.isLeader) {
        return bird;
      }
    }
    return null;
  }

  /** Removes birds that hit an obstacle or the ground; returns how many were lost this step. */
  checkHandleHits(): number {
    let numBirdsLost = 0;
    const copyBirds = [...this.birds];
    for (const bird of copyBirds) {
      if (this.birdHitObstacle(bird)) {
        this.removeBird(bird);
        numBirdsLost++;
        this.deadBirds.push(bird);
        bird.velocity = new Vec2(0, 0);
        bird.orientation = 0;
        bird.color = BROWN;
      }
    }
    return numBirdsLost;
  }

  /** True if the bird (never the leader) overlaps an obstacle edge or has reached the ground. */
  birdHitObstacle(b: Bird): boolean {
    if (b.isLeader) {
      return false;
    }
    const characterPosition = Vec2.copy(b.position);
    const characterAngle = b.velocity.getAngle();

    for (const obstacle of this.obstacles) {
      for (let j = 0; j < 4; j++) {
        let rayLength = b.radius;
        if (j === 0) {
          rayLength *= 1.5;
        }
        const rayAngle = characterAngle + (j * Math.PI) / 2;
        const rayEnd = Vec2.fromAngle(rayAngle).multiplyScalar(rayLength).add(characterPosition);

        if (obstacle.findIntercept(characterPosition, rayEnd) != null) {
          return true;
        }
      }
    }

    // check if hit ground
    return characterPosition.y >= World.YMAX;
  }

  getNumBirds(): number {
    return this.birds.length;
  }
}
