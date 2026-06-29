import { Vec2 } from "./Vec2";
import { SlotFormation } from "./SlotFormation";

/**
 * Followers arranged in a square grid trailing the leader, sized to the follower count
 * (side = ceil(sqrt(numFollowers))). Port of Java `DynamicQuadFormation`, now expressed purely as
 * a slot layout on top of SlotFormation.
 */
export class DynamicQuadFormation extends SlotFormation {
  slotOffsets(numFollowers: number): Vec2[] {
    const side = Math.ceil(Math.sqrt(numFollowers));
    const offsets: Vec2[] = [];
    let count = 0;
    for (let i = 0; i < side && count < numFollowers; i++) {
      const rowDistance = (i + 1) * this.gap;
      for (let j = 0; j < side && count < numFollowers; j++) {
        const colDistance = ((side - 1) / 2 - j) * this.gap;
        offsets.push(new Vec2(rowDistance, colDistance));
        count++;
      }
    }
    return offsets;
  }
}
