import { Obstacle } from "./Obstacle";
import { ObstacleSeries } from "./ObstacleSeries";
import { Path } from "./Path";
import { ObstacleType } from "./types";
import { World } from "./world";
import type { Rng } from "./rng";

/**
 * The game world for one level: a generated series of obstacles plus the flyover path through them.
 * Port of Java `Environment`, decoupled from the game object — it reads layout from `World` and
 * takes generation parameters + an `Rng` directly. (Cleared-obstacle counting, which needs the
 * flock, is added with the game state machine in a later phase.)
 */
export class Environment {
  readonly obstacles: Obstacle[];
  readonly path: Path;

  constructor(numObstacles: number, obstacleType: ObstacleType, gapFactor: number, rng: Rng) {
    const xOffset = World.XMIN + 50;
    const yOffset = World.YMAX;
    const obstacleSpread = World.XMAX - xOffset;
    const height = World.YMAX - World.YMIN - 100;

    const series = new ObstacleSeries(
      obstacleType,
      numObstacles,
      obstacleSpread,
      height,
      xOffset,
      yOffset,
      gapFactor,
      rng,
    );
    this.obstacles = series.getObstacles();

    const pathHeight = (World.YMIN + World.YMAX) / 2;
    const startPoint = [0, pathHeight];
    const endPoint = [World.WIDTH, pathHeight];
    this.path = series.getFlyoverPath(startPoint, endPoint, this.obstacles);
  }
}
