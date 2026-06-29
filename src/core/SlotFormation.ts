import { Vec2 } from "./Vec2";
import { Bird } from "./Bird";
import { Formation } from "./Formation";

/**
 * A leader-led formation: the leader flies (path/avoidance in free-fly, or per manual action) and
 * each follower seeks a slot defined relative to the leader. Subclasses only supply the slot
 * layout via slotOffsets; the leader movement, slot placement, and dead-bird handling are shared.
 *
 * A slot offset is a local vector (x = distance behind the leader, y = sideways); it is rotated
 * into world space by the leader's heading. This generalizes the original DynamicQuadFormation,
 * whose grid is now just one slotOffsets implementation.
 */
export abstract class SlotFormation extends Formation {
  readonly gap = 20;

  /** Local follower offsets in assignment order (birds[1], birds[2], ...). */
  abstract slotOffsets(numFollowers: number): Vec2[];

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

    const numFollowers = this.birds.length - 1;
    const offsets = this.slotOffsets(numFollowers);
    const leadAngle = lead.velocity.getAngle();

    for (let k = 0; k < numFollowers; k++) {
      const b = this.birds[k + 1];
      const offset = offsets[k];
      const length = offset.getLength();
      const theta = offset.getAngle();
      const slotAngle = theta + leadAngle + Math.PI / 2;
      const slotPosition = Vec2.fromAngle(slotAngle).multiplyScalar(length).add(lead.position);

      const target = new Bird();
      target.position = slotPosition;
      target.orientation = lead.orientation;
      target.velocity = Vec2.copy(lead.velocity);

      b.follow(timePeriod, target, this.birds);
    }
    this.moveDeadBirds(timePeriod);
  }
}
