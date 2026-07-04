import { describe, it, expect } from "vitest";
import { GameBirds } from "./GameBirds";
import { ManualAction } from "./Bird";
import { FormationType } from "./types";
import { VeeFormation } from "./VeeFormation";

describe("GameBirds setup", () => {
  it("starts on level 1 in automatic mode with 10 birds over 5 triangles", () => {
    const g = new GameBirds(1);
    expect(g.gameLevel).toBe(1);
    expect(g.manualMode).toBe(false);
    expect(g.formation.birds).toHaveLength(10);
    expect(g.env.obstacles).toHaveLength(5);
    expect(g.endTime).toBe(g.gameTime);

    const lead = g.formation.getLeadBird()!;
    expect(lead.isFreeFly).toBe(true); // automatic mode -> flock flies the path itself
  });
});

describe("GameBirds.isGameLevelEnded", () => {
  it("ends the level (advancing) when all obstacles are cleared", () => {
    const g = new GameBirds(1);
    g.totalObstaclesCleared = g.env.obstacles.length;
    expect(g.isGameLevelEnded()).toBe(true);
    expect(g.numTrials).toBe(0);
  });

  it("ends a round and replays when time expires with obstacles remaining", () => {
    const g = new GameBirds(1);
    g.currTime = g.endTime; // time expired
    g.totalObstaclesCleared = 0; // not cleared
    const levelBefore = g.gameLevel;
    expect(g.isGameLevelEnded()).toBe(true);
    expect(g.numTrials).toBe(1); // a round was consumed
    expect(g.gameLevel).toBe(levelBefore - 1); // decremented (re-incremented by update)
  });

  it("ends the level after the maximum number of rounds", () => {
    const g = new GameBirds(1);
    g.numTrials = g.maxNumTrials - 1;
    g.currTime = g.endTime;
    g.totalObstaclesCleared = 0;
    expect(g.isGameLevelEnded()).toBe(true);
    expect(g.numTrials).toBe(0); // reset after the final round
  });

  it("ends a round when all followers are lost", () => {
    const g = new GameBirds(1);
    g.totalBirdsLost = g.numBirds - 1;
    expect(g.isGameLevelEnded()).toBe(true);
  });
});

describe("GameBirds.setManualMode", () => {
  it("switching to automatic frees the leader and resets follower speeds", () => {
    const g = new GameBirds(1);
    g.setManualMode(false);
    expect(g.manualMode).toBe(false);
    const lead = g.formation.getLeadBird()!;
    expect(lead.isFreeFly).toBe(true);
    for (const bird of g.formation.birds) {
      expect(bird.maxSpeed).toBeCloseTo(bird.isLeader ? 30 : 30 * g.formation.followerSpeedFactor);
    }
  });
});

describe("GameBirds manual control", () => {
  it("Faster/Slower change the leader's speed", () => {
    const g = new GameBirds(1);
    g.setManualMode(true);
    const lead = g.formation.getLeadBird()!;
    const base = lead.maxSpeed;

    g.setLeaderAction(ManualAction.Faster);
    g.update(1 / 40);
    expect(lead.maxSpeed).toBeGreaterThan(base);

    g.setLeaderAction(ManualAction.Slower);
    g.update(1 / 40);
    g.setLeaderAction(ManualAction.Slower);
    g.update(1 / 40);
    expect(lead.maxSpeed).toBeLessThan(base + g.formation.getLeadBird()!.deltaSpeed);
  });

  it("Left/Right turn the leader's heading", () => {
    const g = new GameBirds(1);
    g.setManualMode(true);
    const lead = g.formation.getLeadBird()!;
    const angle0 = lead.velocity.getAngle();

    g.setLeaderAction(ManualAction.Left);
    g.update(1 / 40);
    expect(lead.velocity.getAngle()).not.toBeCloseTo(angle0);
  });
});

describe("GameBirds formation selection", () => {
  it("swaps the formation live while keeping the same birds", () => {
    const g = new GameBirds(1);
    const birdsBefore = g.formation.birds;
    g.setFormationType(FormationType.Vee);
    expect(g.formationType).toBe(FormationType.Vee);
    expect(g.formation).toBeInstanceOf(VeeFormation);
    expect(g.formation.birds).toBe(birdsBefore); // same birds, no reset
  });

  it("cycles Quad -> Vee -> Line -> Quad", () => {
    const g = new GameBirds(1);
    expect(g.formationType).toBe(FormationType.Quad);
    g.cycleFormation();
    expect(g.formationType).toBe(FormationType.Vee);
    g.cycleFormation();
    expect(g.formationType).toBe(FormationType.Line);
    g.cycleFormation();
    expect(g.formationType).toBe(FormationType.Quad);
  });
});

describe("GameBirds.skipToNextLevel", () => {
  it("advances to the next level immediately", () => {
    const g = new GameBirds(1);
    g.skipToNextLevel();
    expect(g.gameLevel).toBe(2);
    expect(g.env.obstacles).toHaveLength(10);
    expect(g.numTrials).toBe(0);
  });

  it("ends the game when skipping past the hard level", () => {
    const g = new GameBirds(1);
    g.gameLevel = 3;
    g.startGameLevel(3);
    g.skipToNextLevel();
    expect(g.gameEnded).toBe(true);
    expect(g.gameLevel).toBe(g.maxGameLevels);
  });
});

describe("GameBirds level progression via update", () => {
  it("advances to level 2 (10 rectangles) when all obstacles are cleared", () => {
    const g = new GameBirds(1);
    // Force every obstacle cleared, then step once.
    for (const o of g.env.obstacles) o.hasBeenCleared = true;
    const totalBefore = g.totalScore;
    g.update(1 / 40);

    expect(g.gameLevel).toBe(2);
    expect(g.env.obstacles).toHaveLength(10);
    expect(g.totalScore).toBeGreaterThan(totalBefore);
  });

  it("ends the game after clearing the hard level", () => {
    const g = new GameBirds(1);
    g.gameLevel = 3;
    g.startGameLevel(3);
    for (const o of g.env.obstacles) o.hasBeenCleared = true;
    g.update(1 / 40);

    expect(g.gameEnded).toBe(true);
    expect(g.gameLevel).toBe(g.maxGameLevels); // clamped, not 4
  });
});
