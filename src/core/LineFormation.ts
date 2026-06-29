import { Vec2 } from "./Vec2";
import { SlotFormation } from "./SlotFormation";

/** Followers arranged in a single column directly behind the leader. */
export class LineFormation extends SlotFormation {
  slotOffsets(numFollowers: number): Vec2[] {
    const offsets: Vec2[] = [];
    for (let k = 0; k < numFollowers; k++) {
      offsets.push(new Vec2((k + 1) * this.gap, 0));
    }
    return offsets;
  }
}
