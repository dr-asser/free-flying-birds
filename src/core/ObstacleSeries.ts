import { Obstacle, TriangleObstacle, RectangleObstacle } from "./Obstacle";
import { Path } from "./Path";
import { ObstacleType } from "./types";
import type { Rng } from "./rng";

/**
 * Procedurally generates a horizontal series of obstacles with gaps between them, scaled to fit a
 * target span and height, plus the flyover path that threads above them. Port of Java
 * `ObstacleSeries`. Randomness is injected via `Rng` so scenes are reproducible.
 */
export class ObstacleSeries {
  private readonly minRandomSample = 0.1;
  private readonly heightToBaseRatio = 2;

  private highestObstacle = 0;
  private gaps: number[];
  private obstacles: Obstacle[] = [];

  constructor(
    private readonly type: ObstacleType,
    private readonly numObstacles: number,
    private readonly length: number,
    private readonly height: number,
    private readonly xOffset: number,
    private readonly yOffset: number,
    private readonly gapFraction: number,
    private readonly rng: Rng,
  ) {
    this.gaps = new Array(numObstacles).fill(0);
    this.generate();
  }

  /** Generates random obstacles + gaps, then scales and lays them out left to right. */
  private generate(): void {
    const gapDesiredLength = this.gapFraction * this.length;
    const obstacleDesiredLength = this.length - gapDesiredLength;

    const gapMeasuredLength = this.generateGaps();
    const obstaclesMeasuredLength = this.generateObstacles();

    const gapScaleFactor = gapDesiredLength / gapMeasuredLength;
    let obstacleScaleFactor = obstacleDesiredLength / obstaclesMeasuredLength;

    if (this.highestObstacle * obstacleScaleFactor > this.height) {
      obstacleScaleFactor = this.height / this.highestObstacle;
    }

    let x = this.xOffset;
    const y = this.yOffset;

    for (let i = 0; i < this.numObstacles; i++) {
      const obstacle = this.obstacles[i];
      obstacle.scale(obstacleScaleFactor);
      obstacle.shift(x, y);
      const xRange = obstacle.getRangeX();
      const obstacleLength = xRange[1] - xRange[0];
      this.gaps[i] *= gapScaleFactor;
      x += obstacleLength + this.gaps[i];
      obstacle.computeFlyoverPoint();
    }
  }

  /** Random gap widths (pre-scaling); returns their total. */
  private generateGaps(): number {
    let totalGapLength = 0;
    for (let i = 0; i < this.numObstacles; i++) {
      const gapLength = Math.max(this.minRandomSample, this.rng.next());
      this.gaps[i] = gapLength;
      totalGapLength += gapLength;
    }
    return totalGapLength;
  }

  /** Random obstacles (pre-scaling); records the tallest and returns total base length. */
  private generateObstacles(): number {
    let totalObstacleLength = 0;
    this.highestObstacle = 0;
    this.obstacles = [];
    for (let i = 0; i < this.numObstacles; i++) {
      const obstacle = this.generateRandomObstacle();
      const xRange = obstacle.getRangeX();
      totalObstacleLength += xRange[1] - xRange[0];

      const yRange = obstacle.getRangeY();
      const height = yRange[1] - yRange[0];
      if (height > this.highestObstacle) {
        this.highestObstacle = height;
      }
      this.obstacles.push(obstacle);
    }
    return totalObstacleLength;
  }

  /** One obstacle of the configured type, at a random scale. */
  private generateRandomObstacle(): Obstacle {
    const scaleFactor = Math.max(this.minRandomSample, this.rng.next());

    let obstacle: Obstacle;
    switch (this.type) {
      case ObstacleType.Rectangle:
        obstacle = new RectangleObstacle(this.heightToBaseRatio);
        break;
      case ObstacleType.Mixed:
        obstacle =
          this.rng.next() < 0.5
            ? new TriangleObstacle(this.heightToBaseRatio)
            : new RectangleObstacle(this.heightToBaseRatio);
        break;
      case ObstacleType.Triangle:
      default:
        obstacle = new TriangleObstacle(this.heightToBaseRatio);
        break;
    }

    obstacle.scale(scaleFactor);
    return obstacle;
  }

  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  /**
   * Builds the path the flock follows in automatic mode: from `startPoint`, across two waypoints
   * above each obstacle (just above its flyover point), to `endPoint`.
   */
  getFlyoverPath(startPoint: number[], endPoint: number[], obstacles: Obstacle[]): Path {
    const coordinates: number[][] = new Array(this.numObstacles * 2 + 2);
    coordinates[0] = startPoint;
    coordinates[this.numObstacles * 2 + 1] = endPoint;
    let index = 1;
    for (const obstacle of obstacles) {
      const flyoverPoint = obstacle.getFlyoverPoint();
      const y = flyoverPoint[1] - 0.75 * obstacle.acceptedRange;
      const xRange = obstacle.getRangeX();
      coordinates[index++] = [xRange[0], y];
      coordinates[index++] = [xRange[1], y];
    }
    return new Path(coordinates);
  }
}
