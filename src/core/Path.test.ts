import { describe, it, expect } from "vitest";
import { Path } from "./Path";
import { Vec2 } from "./Vec2";

describe("Path", () => {
  // An L-shaped path: (0,0) -> (100,0) -> (100,100). Total length 200.
  const makePath = () =>
    new Path([
      [0, 0],
      [100, 0],
      [100, 100],
    ]);

  it("accumulates arc length along segments", () => {
    const p = makePath();
    expect(p.pathLength).toEqual([0, 100, 200]);
  });

  it("getPosition maps arc length back to world points", () => {
    const p = makePath();
    expect([p.getPosition(0).x, p.getPosition(0).y]).toEqual([0, 0]);
    const mid1 = p.getPosition(50); // halfway along first segment
    expect(mid1.x).toBeCloseTo(50);
    expect(mid1.y).toBeCloseTo(0);
    const mid2 = p.getPosition(150); // halfway along second segment
    expect(mid2.x).toBeCloseTo(100);
    expect(mid2.y).toBeCloseTo(50);
  });

  it("getPosition clamps beyond the path ends", () => {
    const p = makePath();
    expect([p.getPosition(-10).x, p.getPosition(-10).y]).toEqual([0, 0]);
    expect([p.getPosition(999).x, p.getPosition(999).y]).toEqual([100, 100]);
  });

  it("getLengthAlongPath projects a nearby point onto the path", () => {
    const p = makePath();
    // A point above the first segment projects to roughly x=40 along it.
    const len = p.getLengthAlongPath(new Vec2(40, 20), 0);
    expect(len).toBeCloseTo(40);
  });
});
