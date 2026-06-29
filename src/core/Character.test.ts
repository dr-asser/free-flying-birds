import { describe, it, expect } from "vitest";
import { Character } from "./Character";
import { SteeringOutput } from "./SteeringOutput";
import { Vec2 } from "./Vec2";
import { World } from "./world";

describe("Character.update", () => {
  it("advances position by the steering velocity over time", () => {
    const c = new Character();
    c.maxSpeed = 30;
    const s = new SteeringOutput();
    s.velocity = new Vec2(10, 0);
    c.update(s, 1);
    expect(c.position.x).toBeCloseTo(10);
    expect(c.position.y).toBeCloseTo(0);
  });

  it("applies linear acceleration to velocity", () => {
    const c = new Character();
    c.maxSpeed = 100;
    const s = new SteeringOutput();
    s.velocity = new Vec2(0, 0);
    s.linearAcceleration = new Vec2(10, 0); // *time(1) -> velocity (10,0)
    c.update(s, 1);
    expect(c.velocity.x).toBeCloseTo(10);
    expect(c.position.x).toBeCloseTo(10);
  });

  it("clamps speed to maxSpeed", () => {
    const c = new Character();
    c.maxSpeed = 30;
    const s = new SteeringOutput();
    s.velocity = new Vec2(100, 0);
    c.update(s, 1);
    expect(c.velocity.getLength()).toBeCloseTo(30);
    expect(c.position.x).toBeCloseTo(30);
  });

  it("does nothing for a null steering", () => {
    const c = new Character();
    c.position = new Vec2(5, 5);
    c.update(null, 1);
    expect([c.position.x, c.position.y]).toEqual([5, 5]);
  });

  it("clamps position to the world bounds", () => {
    const c = new Character();
    c.maxSpeed = 100000;
    const s = new SteeringOutput();
    s.velocity = new Vec2(100000, 100000);
    c.update(s, 1);
    expect(c.position.x).toBe(World.WIDTH);
    expect(c.position.y).toBe(World.HEIGHT);
  });
});
