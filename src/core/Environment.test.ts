import { describe, it, expect } from "vitest";
import { Environment } from "./Environment";
import { Rng } from "./rng";
import { ObstacleType } from "./types";
import { World } from "./world";

describe("Environment", () => {
  it("generates the requested number of obstacles and a matching flyover path", () => {
    const env = new Environment(5, ObstacleType.Triangle, 0.5, new Rng(1));
    expect(env.obstacles).toHaveLength(5);
    // path = start + (2 waypoints per obstacle) + end
    expect(env.path.numPoints).toBe(5 * 2 + 2);
  });

  it("lays obstacles out left to right within the visible band", () => {
    const env = new Environment(10, ObstacleType.Mixed, 0.5, new Rng(42));
    const xOffset = World.XMIN + 50;

    // First obstacle starts at the x offset; the base sits on yMax.
    expect(env.obstacles[0].getRangeX()[0]).toBeCloseTo(xOffset);

    let prevLeft = -Infinity;
    for (const o of env.obstacles) {
      const [left, right] = o.getRangeX();
      const [minY, maxY] = o.getRangeY();
      expect(left).toBeGreaterThanOrEqual(prevLeft); // non-decreasing
      prevLeft = left;
      expect(left).toBeGreaterThanOrEqual(xOffset - 0.5);
      expect(right).toBeLessThanOrEqual(World.XMAX + 1);
      expect(maxY).toBeCloseTo(World.YMAX); // base on the ground line
      expect(minY).toBeGreaterThanOrEqual(World.YMIN - 1); // top within the band
    }
  });

  it("is deterministic for a given seed", () => {
    const a = new Environment(5, ObstacleType.Triangle, 0.5, new Rng(7));
    const b = new Environment(5, ObstacleType.Triangle, 0.5, new Rng(7));
    expect(a.obstacles.map((o) => o.getRangeX())).toEqual(b.obstacles.map((o) => o.getRangeX()));
  });
});
