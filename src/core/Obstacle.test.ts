import { describe, it, expect } from "vitest";
import { Obstacle, TriangleObstacle, RectangleObstacle } from "./Obstacle";
import { Vec2 } from "./Vec2";

describe("Obstacle shapes", () => {
  it("TriangleObstacle has the expected outline and ranges", () => {
    const t = new TriangleObstacle(2);
    expect(t.numPoints).toBe(4);
    expect(t.getRangeX()).toEqual([0, 1]);
    expect(t.getRangeY()).toEqual([-2, 0]);
  });

  it("RectangleObstacle has the expected outline and ranges", () => {
    const r = new RectangleObstacle(3);
    expect(r.numPoints).toBe(5);
    expect(r.getRangeX()).toEqual([0, 1]);
    expect(r.getRangeY()).toEqual([-3, 0]);
  });

  it("computes the flyover point centered just above the top", () => {
    const t = new TriangleObstacle(2);
    // center x = 0.5; clearance 0.1 * height(2) = 0.2 above the top (min y = -2)
    expect(t.getFlyoverPoint()[0]).toBeCloseTo(0.5);
    expect(t.getFlyoverPoint()[1]).toBeCloseTo(-2.2);
  });
});

describe("Obstacle.findIntercept (screen-scale triangle)", () => {
  // Base (100,400)-(300,400), apex (200,200).
  const makeTriangle = () =>
    new Obstacle([
      [100, 400],
      [300, 400],
      [200, 200],
      [100, 400],
    ]);

  it("returns the crossing point when a ray hits an edge", () => {
    const o = makeTriangle();
    const hit = o.findIntercept(new Vec2(200, 500), new Vec2(200, 250));
    expect(hit).not.toBeNull();
    expect(hit!.x).toBeCloseTo(200);
    expect(hit!.y).toBeCloseTo(400);
    expect(o.interceptSegment).toBe(1); // the base edge
  });

  it("returns null when the ray stops short of every edge", () => {
    const o = makeTriangle();
    expect(o.findIntercept(new Vec2(200, 500), new Vec2(200, 450))).toBeNull();
  });

  it("GetTarget offsets to the side of the hit edge nearer the character", () => {
    const o = makeTriangle();
    o.findIntercept(new Vec2(200, 500), new Vec2(200, 250));
    const target = o.GetTarget({ position: new Vec2(200, 500) }, 20);
    expect(target.x).toBeCloseTo(200);
    expect(target.y).toBeCloseTo(420);
  });
});

describe("Obstacle.isCleared", () => {
  // flyover point of this triangle is (200, 180).
  const makeTriangle = () =>
    new Obstacle([
      [100, 400],
      [300, 400],
      [200, 200],
      [100, 400],
    ]);

  it("clears and latches when within acceptedRange of the flyover point", () => {
    const o = makeTriangle();
    expect(o.isCleared(new Vec2(200, 219))).toBe(true); // distance 39 <= 40
    expect(o.hasBeenCleared).toBe(true);
    // latched: stays cleared even when far away
    expect(o.isCleared(new Vec2(0, 0))).toBe(true);
  });

  it("does not clear when outside acceptedRange", () => {
    const o = makeTriangle();
    expect(o.isCleared(new Vec2(300, 180))).toBe(false); // distance 100 > 40
    expect(o.hasBeenCleared).toBe(false);
  });
});
