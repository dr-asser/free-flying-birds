import { describe, it, expect } from "vitest";
import { Vec2 } from "./Vec2";

const TAU = Math.PI * 2;

/** Smallest absolute difference between two angles, accounting for 2*PI wraparound. */
function angleDiff(a: number, b: number): number {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return Math.abs(d);
}

describe("Vec2", () => {
  it("fromAngle(0) points along +y (y-down convention)", () => {
    const v = Vec2.fromAngle(0);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(1);
  });

  it("getAngle matches the y-down convention", () => {
    expect(new Vec2(0, 1).getAngle()).toBeCloseTo(0);
    expect(new Vec2(1, 0).getAngle()).toBeCloseTo(Math.PI / 2);
  });

  it("fromAngle and getAngle round-trip (modulo 2*PI)", () => {
    // getAngle's range is (-PI/2, 3*PI/2], so the inverse holds only up to 2*PI wraparound.
    for (const a of [-Math.PI + 0.01, -1, -0.1, 0, 0.5, 1.2, Math.PI]) {
      expect(angleDiff(Vec2.fromAngle(a).getAngle(), a)).toBeCloseTo(0);
    }
  });

  it("normalize yields unit length", () => {
    expect(new Vec2(3, 4).normalize().getLength()).toBeCloseTo(1);
    expect(new Vec2(3, 4).getLength()).toBeCloseTo(5);
  });

  it("add / subtract / multiplyScalar mutate in place and return this", () => {
    const v = new Vec2(1, 2);
    const added = v.add(new Vec2(3, 4));
    expect(added).toBe(v);
    expect([v.x, v.y]).toEqual([4, 6]);

    v.subtract(new Vec2(1, 1));
    expect([v.x, v.y]).toEqual([3, 5]);

    v.multiplyScalar(2);
    expect([v.x, v.y]).toEqual([6, 10]);
  });

  it("copy is an independent clone", () => {
    const a = new Vec2(7, 8);
    const b = Vec2.copy(a);
    b.add(new Vec2(1, 1));
    expect([a.x, a.y]).toEqual([7, 8]);
    expect([b.x, b.y]).toEqual([8, 9]);
  });

  it("fromAngle is periodic over 2*PI", () => {
    const a = Vec2.fromAngle(0.7);
    const b = Vec2.fromAngle(0.7 + TAU);
    expect(a.x).toBeCloseTo(b.x);
    expect(a.y).toBeCloseTo(b.y);
  });
});
