import { Vec2 } from "./Vec2";
import { Bird } from "./Bird";
import { Formation } from "./Formation";

/**
 * A flock that arranges its followers in a square grid trailing the leader, sized to the follower
 * count and oriented to the leader's heading. Port of Java `DynamicQuadFormation`.
 *
 * Each step, the leader moves (path-following/avoidance in free-fly, or per manual action),
 * then every follower seeks its computed slot via the follow() blend.
 */
export class DynamicQuadFormation extends Formation {
  private side = 0;
  readonly gap = 20;

  /** Grid side length: ceil(sqrt(numFollowers)). */
  private computeSide(): number {
    const numFollowers = this.birds.length - 1;
    return Math.ceil(Math.sqrt(numFollowers));
  }

  override addBird(b: Bird): boolean {
    const added = super.addBird(b);
    if (added) {
      this.side = this.computeSide();
    }
    return added;
  }

  override removeBird(b: Bird): boolean {
    const removed = super.removeBird(b);
    if (removed) {
      this.side = this.computeSide();
    }
    return removed;
  }

  override move(timePeriod: number): void {
    const lead = this.birds[0];
    if (lead == null) {
      return;
    }

    if (lead.isFreeFly) {
      if (!lead.avoidObstacle(timePeriod, this.obstacles)) {
        lead.moveAlongPath(timePeriod, this.path);
      }
    } else {
      lead.movePerAction(timePeriod);
      // the leader's speed may have changed; match the rest of the flock to it
      const leadMaxSpeed = lead.maxSpeed;
      for (const bird of this.birds) {
        if (!bird.isLeader) {
          bird.maxSpeed = leadMaxSpeed * this.followerSpeedFactor;
        }
      }
    }

    let slotNumber = 1;
    for (let i = 0; i < this.side; i++) {
      const rowDistance = (i + 1) * this.gap;
      for (let j = 0; j < this.side; j++) {
        if (slotNumber === this.birds.length) {
          break;
        }
        const b = this.birds[slotNumber];
        slotNumber++;

        const colDistance = ((this.side - 1) / 2 - j) * this.gap;
        const slot = new Vec2(rowDistance, colDistance);
        const length = slot.getLength();
        const theta = slot.getAngle();
        const leadAngle = lead.velocity.getAngle();
        const slotAngle = theta + leadAngle + Math.PI / 2;
        const slotPosition = Vec2.fromAngle(slotAngle).multiplyScalar(length).add(lead.position);

        const target = new Bird();
        target.position = slotPosition;
        target.orientation = lead.orientation;
        target.velocity = Vec2.copy(lead.velocity);

        b.follow(timePeriod, target, this.birds);
      }
    }
    this.moveDeadBirds(timePeriod);
  }
}
