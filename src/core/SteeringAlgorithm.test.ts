import { describe, it, expect } from "vitest";
import { SteeringAlgorithm } from "./SteeringAlgorithm";
import { Vec2 } from "./Vec2";
import type { Steerable } from "./Steerable";

function steerable(overrides: Partial<Steerable> = {}): Steerable {
  return {
    position: new Vec2(0, 0),
    velocity: new Vec2(0, 0),
    orientation: 0,
    rotation: 0,
    maxSpeed: 10,
    ...overrides,
  };
}

const algo = new SteeringAlgorithm();

describe("mapToRange", () => {
  it("leaves angles already in (-PI, PI] unchanged", () => {
    expect(algo.mapToRange(0)).toBeCloseTo(0);
    expect(algo.mapToRange(Math.PI)).toBeCloseTo(Math.PI);
    expect(algo.mapToRange(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
  });

  it("wraps angles outside the range", () => {
    expect(algo.mapToRange(1.5 * Math.PI)).toBeCloseTo(-0.5 * Math.PI);
    expect(algo.mapToRange(-1.5 * Math.PI)).toBeCloseTo(0.5 * Math.PI);
    expect(algo.mapToRange(3 * Math.PI)).toBeCloseTo(Math.PI);
  });
});

describe("getKinematicOrientation", () => {
  it("derives orientation from velocity (y-down)", () => {
    expect(algo.getKinematicOrientation(0, new Vec2(1, 0))).toBeCloseTo(Math.PI / 2);
    expect(algo.getKinematicOrientation(0, new Vec2(0, 1))).toBeCloseTo(0);
  });

  it("keeps current orientation when not moving", () => {
    expect(algo.getKinematicOrientation(1.23, new Vec2(0, 0))).toBe(1.23);
  });
});

describe("kinematicSeek", () => {
  it("produces a velocity of maxSpeed toward the target", () => {
    const c = steerable({ position: new Vec2(0, 0), maxSpeed: 10 });
    const target = steerable({ position: new Vec2(100, 0) });
    const s = algo.kinematicSeek(c, target);
    expect(s.velocity.x).toBeCloseTo(10);
    expect(s.velocity.y).toBeCloseTo(0);
    expect(s.velocity.getLength()).toBeCloseTo(10);
  });
});

describe("dynamicSeek", () => {
  it("accelerates at maxLinearAcceleration toward the target", () => {
    const c = steerable({ position: new Vec2(0, 0) });
    const target = steerable({ position: new Vec2(0, -50) });
    const s = algo.dynamicSeek(c, target);
    expect(s.linearAcceleration.getLength()).toBeCloseTo(algo.maxLinearAcceleration);
    expect(s.linearAcceleration.x).toBeCloseTo(0);
    expect(s.linearAcceleration.y).toBeCloseTo(-algo.maxLinearAcceleration);
  });
});

describe("separation", () => {
  it("pushes away from a nearby neighbor with inverse-square strength", () => {
    const c = steerable({ position: new Vec2(0, 0) });
    const neighbor = steerable({ position: new Vec2(10, 0) }); // distance 10, within threshold
    const s = algo.separation(c, [neighbor]);
    // strength = min(1000 / 10^2, 100) = 10, directed away (-x)
    expect(s.linearAcceleration.x).toBeCloseTo(-10);
    expect(s.linearAcceleration.y).toBeCloseTo(0);
  });

  it("ignores neighbors beyond the separation threshold", () => {
    const c = steerable({ position: new Vec2(0, 0) });
    const far = steerable({ position: new Vec2(1000, 0) });
    const s = algo.separation(c, [far]);
    expect(s.linearAcceleration.getLength()).toBeCloseTo(0);
  });
});

describe("velocityMatch", () => {
  it("accelerates toward the target velocity, clamped to the max", () => {
    const c = steerable({ velocity: new Vec2(0, 0) });
    const target = steerable({ velocity: new Vec2(10, 0) });
    const s = algo.velocityMatch(c, target);
    // (10,0)/0.08 = (125,0), clamped to length 100 along +x
    expect(s.linearAcceleration.getLength()).toBeCloseTo(100);
    expect(s.linearAcceleration.x).toBeCloseTo(100);
  });
});

describe("weightedBlending", () => {
  it("returns null when all inputs are null", () => {
    expect(algo.weightedBlending([null, null], [1, 1])).toBeNull();
  });

  it("combines accelerations by weight and clamps to the max", () => {
    const c = steerable({ position: new Vec2(0, 0) });
    const a = algo.dynamicSeek(c, steerable({ position: new Vec2(0, -1) })); // accel (0,-100)
    const b = algo.dynamicSeek(c, steerable({ position: new Vec2(1, 0) })); // accel (100,0)
    const blended = algo.weightedBlending([a, b], [1, 1]);
    expect(blended).not.toBeNull();
    // raw sum (100,-100) has length ~141 -> clamped to 100
    expect(blended!.linearAcceleration.getLength()).toBeCloseTo(100);
  });
});

describe("align", () => {
  it("returns zero when orientations already match", () => {
    const c = steerable({ orientation: 1 });
    const target = steerable({ orientation: 1 });
    expect(algo.align(c, target)).toBe(0);
  });

  it("returns a nonzero correction when orientations differ", () => {
    const c = steerable({ orientation: 0, rotation: 0 });
    const target = steerable({ orientation: 1 });
    expect(algo.align(c, target)).not.toBe(0);
  });
});
