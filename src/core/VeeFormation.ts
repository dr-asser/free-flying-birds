import { Vec2 } from "./Vec2";
import { SlotFormation } from "./SlotFormation";

/**
 * Followers arranged in a "V" (echelon) trailing the leader: alternating left/right arms, each
 * successive pair one step deeper and wider.
 */
export class VeeFormation extends SlotFormation {
  slotOffsets(numFollowers: number): Vec2[] {
    const offsets: Vec2[] = [];
    for (let k = 0; k < numFollowers; k++) {
      const arm = k % 2; // 0 = left, 1 = right
      const depth = Math.floor(k / 2) + 1;
      const behind = depth * this.gap;
      const side = (arm === 0 ? -1 : 1) * depth * this.gap;
      offsets.push(new Vec2(behind, side));
    }
    return offsets;
  }
}
