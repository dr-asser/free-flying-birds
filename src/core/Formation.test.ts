import { describe, it, expect } from "vitest";
import { Formation } from "./Formation";
import { DynamicQuadFormation } from "./DynamicQuadFormation";
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
  it("sizes the grid to ceil(sqrt(numFollowers))", () => {
    const f = new DynamicQuadFormation(makeEnv());
    // @ts-expect-error access private for testing
    const sideOf = () => f.side as number;
    f.addBird(new Bird()); // leader, 0 followers
    expect(sideOf()).toBe(0);
    for (let i = 0; i < 4; i++) f.addBird(new Bird()); // 4 followers -> side 2
    expect(sideOf()).toBe(2);
    f.addBird(new Bird()); // 5 followers -> ceil(sqrt(5)) = 3
    expect(sideOf()).toBe(3);
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
