import { Vec2 } from "./Vec2";
import { Environment } from "./Environment";
import { SlotFormation } from "./SlotFormation";
import { makeFormation } from "./formations";
import { Bird, ManualAction } from "./Bird";
import { Rng } from "./rng";
import { ObstacleType, FormationType } from "./types";

/**
 * The game state machine. Port of Java `GameBirds` (the simulation half — rendering and raw
 * keyboard handling live in the render/input layers).
 *
 * Three levels (5 triangles / 10 rectangles / 15 mixed), 60 sim-seconds each, up to three rounds
 * per level. Score = obstaclesCleared * level * 5 - birdsLost. Clearing every obstacle (or losing
 * all followers, or the timer expiring) ends a level; see isGameLevelEnded for the exact round/
 * level logic, preserved verbatim from the original. The leader flies manually (player) or, in
 * automatic mode, along the flyover path. Driven one fixed timestep at a time via update(dt).
 */
export class GameBirds {
  manualMode = false;
  score = 0;
  totalScore = 0;
  totalBirdsLost = 0;
  totalObstaclesCleared = 0;
  gameLevel = 1; // 1=easy, 2=medium, 3=hard
  readonly maxGameLevels = 3;
  readonly numBirds = 10;
  readonly gameTime = 60;
  endTime = 0;
  numTrials = 0;
  readonly maxNumTrials = 3;

  currTime = 0;
  gameEnded = false;
  formationType: FormationType = FormationType.Quad;

  env!: Environment;
  formation!: SlotFormation;
  private readonly rng: Rng;

  constructor(seed = 1) {
    this.rng = new Rng(seed);
    this.startGameLevel(this.gameLevel);
  }

  /** Advances the simulation one fixed timestep (the Java gameLoop, minus keyboard handling). */
  update(timePeriod: number): void {
    const numBirdsLost = this.formation.checkHandleHits();
    this.totalBirdsLost += numBirdsLost;
    this.formation.move(timePeriod);
    this.totalObstaclesCleared = this.checkObstaclesCleared();
    this.score = this.totalObstaclesCleared * this.gameLevel * 5 - this.totalBirdsLost;

    if (this.isGameLevelEnded()) {
      this.gameLevel++;
      this.totalScore += this.score;
      this.score = 0;

      if (this.gameLevel > this.maxGameLevels) {
        this.gameLevel = this.maxGameLevels;
        this.gameEnded = true;
      } else {
        this.startGameLevel(this.gameLevel);
      }
    }

    // Matches Java Game.start: currTime advances after the loop body / level check.
    this.currTime += timePeriod;
  }

  /** Sets the leader's manual action for this step (translated from keyboard input by the caller). */
  setLeaderAction(action: ManualAction): void {
    const lead = this.formation.getLeadBird();
    if (lead) {
      lead.manualAction = action;
    }
  }

  /** Decides whether the current level ended (and updates round/level bookkeeping). Verbatim port. */
  isGameLevelEnded(): boolean {
    const clearedAllObstacles = this.totalObstaclesCleared === this.env.obstacles.length;
    const allBirdsGone = this.totalBirdsLost === this.numBirds - 1;
    const timeExpired = this.currTime >= this.endTime;

    const endOfRound = (timeExpired && !clearedAllObstacles) || allBirdsGone;
    const endOfLevel = clearedAllObstacles || allBirdsGone || timeExpired;

    if (endOfRound) {
      this.numTrials++;
      if (this.numTrials >= this.maxNumTrials) {
        this.numTrials = 0;
        return true;
      }
      this.gameLevel--;
      this.totalScore -= this.score;
      return true;
    }
    if (endOfLevel) {
      this.numTrials = 0;
      return true;
    }
    return false;
  }

  /** (Re)builds a level: its obstacles, path, flock, and the 60-second timer. */
  startGameLevel(gameLevel: number): void {
    this.totalBirdsLost = 0;
    this.totalObstaclesCleared = 0;
    const numObstacles = gameLevel * 5;
    const obstacleType = (gameLevel - 1) as ObstacleType;
    const gapFactor = 0.5;

    this.env = new Environment(numObstacles, obstacleType, gapFactor, this.rng);
    this.formation = makeFormation(this.formationType, this.env);

    for (let i = 0; i < this.numBirds; i++) {
      const b = new Bird();
      b.position = new Vec2(this.rng.next() * 50, 300 + this.rng.next() * 50);
      this.formation.addBird(b);
    }

    if (this.manualMode) {
      const lead = this.formation.getLeadBird();
      if (lead) {
        lead.isFreeFly = false;
        lead.manualAction = ManualAction.None;
        lead.velocity = Vec2.fromAngle(Math.PI / 2);
        lead.velocity.multiplyScalar(lead.maxSpeed);
      }
    }

    this.endTime = this.currTime + this.gameTime;
  }

  /** Switches between manual and automatic flight, matching the original's mode transition. */
  setManualMode(isManual: boolean): void {
    const lead = this.formation.getLeadBird();
    if (lead) {
      lead.manualAction = ManualAction.None;
      lead.isFreeFly = !isManual;
    }

    // transition from manual to automatic: reset speeds (manual mode may have changed them)
    if (this.manualMode && !isManual) {
      for (const bird of this.formation.birds) {
        bird.maxSpeed = bird.isLeader ? 30 : 30 * this.formation.followerSpeedFactor;
      }
    }

    this.manualMode = isManual;
  }

  /** Switches the follower layout live, keeping the current birds (no level reset). */
  setFormationType(type: FormationType): void {
    this.formationType = type;
    const previous = this.formation;
    this.formation = makeFormation(type, this.env);
    this.formation.birds = previous.birds;
    this.formation.deadBirds = previous.deadBirds;
  }

  /** Cycles to the next follower layout. */
  cycleFormation(): void {
    const next = ((this.formationType + 1) % 3) as FormationType;
    this.setFormationType(next);
  }

  /** Ends the current level immediately and advances to the next (or wins after the hard level). */
  skipToNextLevel(): void {
    this.totalScore += this.score;
    this.score = 0;
    this.numTrials = 0;
    this.gameLevel++;
    if (this.gameLevel > this.maxGameLevels) {
      this.gameLevel = this.maxGameLevels;
      this.gameEnded = true;
    } else {
      this.startGameLevel(this.gameLevel);
    }
  }

  /** Counts cleared obstacles, latching newly-passed ones against the leader (Environment port). */
  private checkObstaclesCleared(): number {
    const leadBird = this.formation.getLeadBird();
    let numObstaclesCleared = 0;
    if (leadBird == null || this.formation.getNumBirds() <= 1) {
      for (const obstacle of this.env.obstacles) {
        if (obstacle.hasBeenCleared) numObstaclesCleared++;
      }
      return numObstaclesCleared;
    }
    for (const obstacle of this.env.obstacles) {
      if (obstacle.isCleared(leadBird.position)) numObstaclesCleared++;
    }
    return numObstaclesCleared;
  }
}
