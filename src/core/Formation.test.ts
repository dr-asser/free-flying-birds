import { describe, it, expect } from "vitest";
import { Formation } from "./Formation";
import { DynamicQuadFormation } from "./DynamicQuadFormation";
import { VeeFormation } from "./VeeFormation";
import { LineFormation } from "./LineFormation";
import { Bird } from "./Bird";
import { Environment } from "./Environment";
import { Obstacle } from "./Obstacle";
import { Rng } from "./rng";
import { Vec2 } from "./Vec2";
import { ObstacleType } from "./types";
import { World } from "./world";
import { RED } from "./Color";

function makeEnv() {
  return new Environment(5, ObstacleType.Triangle, 0.5, new Rng(1));
}

describe("Formation membership", () => {
  it("makes the first bird the red leader and speeds up later birds", () => {
    const f = new Formation(makeEnv());
    const leader = new Bird();
    const follower = new Bird();
    f.addBird(leader);
    f.addBird(follower);

    expect(leader.isLeader).toBe(true);
    expect(leader.color).toEqual(RED);
    expect(f.getLeadBird()).toBe(leader);
    expect(follower.isLeader).toBe(false);
    expect(follower.maxSpeed).toBeCloseTo(30 * f.followerSpeedFactor);
  });

  it("promotes the next bird when the leader is removed", () => {
    const f = new Formation(makeEnv());
    const leader = new Bird();
    const next = new Bird();
    f.addBird(leader);
    f.addBird(next);

    expect(f.removeBird(leader)).toBe(true);
    expect(next.isLeader).toBe(true);
    expect(f.getLeadBird()).toBe(next);
  });
});

describe("Formation.birdHitObstacle", () => {
  // Screen-scale triangle: base (100,400)-(300,400), apex (200,200).
  const triangle = () =>
    new Obstacle([
      [100, 400],
      [300, 400],
      [200, 200],
      [100, 400],
    ]);

  it("detects a follower overlapping an obstacle edge", () => {
    const f = new Formation(makeEnv());
    f.obstacles = [triangle()];
    const bird = new Bird(); // not a leader
    bird.position = new Vec2(200, 402); // just below the base edge
    bird.velocity = new Vec2(0, -1); // heading up, a ray crosses the base
    expect(f.birdHitObstacle(bird)).toBe(true);
  });

  it("never reports the leader as hit", () => {
    const f = new Formation(makeEnv());
    f.obstacles = [triangle()];
    const leader = new Bird();
    leader.isLeader = true;
    leader.position = new Vec2(200, 402);
    leader.velocity = new Vec2(0, -1);
    expect(f.birdHitObstacle(leader)).toBe(false);
  });

  it("detects hitting the ground", () => {
    const f = new Formation(makeEnv());
    f.obstacles = [];
    const bird = new Bird();
    bird.position = new Vec2(500, World.YMAX + 5);
    expect(f.birdHitObstacle(bird)).toBe(true);
  });
});

describe("DynamicQuadFormation", () => {
  it("lays followers in a sqrt-sized grid", () => {
    const f = new DynamicQuadFormation(makeEnv());
    expect(f.slotOffsets(0)).toHaveLength(0);
    expect(f.slotOffsets(4)).toHaveLength(4); // 2x2 grid
    expect(f.slotOffsets(5)).toHaveLength(5); // side 3, first 5 slots used
    // first slot sits one gap behind the leader
    expect(f.slotOffsets(4)[0].x).toBeCloseTo(f.gap);
  });

  it("Vee formation alternates left/right arms growing in depth", () => {
    const f = new VeeFormation(makeEnv());
    const o = f.slotOffsets(4);
    expect(o).toHaveLength(4);
    expect(o[0].y).toBeLessThan(0); // first follower on the left arm
    expect(o[1].y).toBeGreaterThan(0); // second on the right arm
    expect(o[2].x).toBeGreaterThan(o[0].x); // deeper pair is further behind
  });

  it("Line formation trails straight behind the leader", () => {
    const f = new LineFormation(makeEnv());
    const o = f.slotOffsets(3);
    expect(o.map((v) => v.y)).toEqual([0, 0, 0]);
    expect(o[0].x).toBeLessThan(o[1].x);
    expect(o[1].x).toBeLessThan(o[2].x);
  });

  it("flies the flock rightward along the path in automatic mode without errors", () => {
    const rng = new Rng(7);
    const env = new Environment(5, ObstacleType.Triangle, 0.5, rng);
    const f = new DynamicQuadFormation(env);
    for (let i = 0; i < 10; i++) {
      const b = new Bird();
      b.position = new Vec2(rng.next() * 50, 300 + rng.next() * 50);
      f.addBird(b);
    }
    const lead = f.getLeadBird()!;
    const startX = lead.position.x;

    const dt = 1 / 40;
    for (let step = 0; step < 400; step++) {
      f.checkHandleHits();
      f.move(dt);
    }

    expect(lead.position.x).toBeGreaterThan(startX + 50); // progressed along the path
    // all positions stay finite
    for (const b of [...f.birds, ...f.deadBirds]) {
      expect(Number.isFinite(b.position.x)).toBe(true);
      expect(Number.isFinite(b.position.y)).toBe(true);
    }
    expect(f.birds.length + f.deadBirds.length).toBe(10);
  });
});
