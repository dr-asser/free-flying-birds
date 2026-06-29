import { Vec2 } from "./Vec2";

/**
 * A convex/polygonal obstacle. Port of Java `Obstacle`.
 *
 * Stores its outline as parallel `x`/`y` arrays (the last point repeats the first to close the
 * loop). Rendering lives in the render layer; this class is pure geometry: ray intercepts for
 * collision/avoidance, a "flyover" target point above the obstacle, and clear detection.
 */
export class Obstacle {
  x: number[] = [];
  y: number[] = [];
  numPoints = 0;

  // Scratch state from the most recent findIntercept() call, consumed by GetTarget().
  interceptSegment = -1;
  interceptX = 0;
  interceptY = 0;

  flyoverPoint: number[] = [0, 0];
  readonly flyoverClearance = 0.1;
  readonly acceptedRange = 40;
  hasBeenCleared = false;

  constructor(coordinates?: number[][]) {
    if (coordinates) {
      this.set(coordinates);
    }
  }

  /** Sets the outline from [x, y] coordinate pairs and recomputes the flyover point. */
  set(coordinates: number[][]): void {
    this.numPoints = coordinates.length;
    this.x = new Array(this.numPoints);
    this.y = new Array(this.numPoints);
    for (let i = 0; i < this.numPoints; i++) {
      this.x[i] = coordinates[i][0];
      this.y[i] = coordinates[i][1];
    }
    this.computeFlyoverPoint();
  }

  /** Scales the obstacle about the origin. */
  scale(scaleFactor: number): void {
    for (let i = 0; i < this.numPoints; i++) {
      this.x[i] *= scaleFactor;
      this.y[i] *= scaleFactor;
    }
  }

  /** Translates the obstacle. */
  shift(x0: number, y0: number): void {
    for (let i = 0; i < this.numPoints; i++) {
      this.x[i] += x0;
      this.y[i] += y0;
    }
  }

  /**
   * Finds where the ray (characterPosition -> rayEnd) crosses an obstacle edge, if any.
   * Records the hit segment/point for a subsequent GetTarget() call. Returns null if no hit.
   * Line-line intersection per https://en.wikipedia.org/wiki/Line-line_intersection.
   */
  findIntercept(characterPosition: Vec2, rayEnd: Vec2): Vec2 | null {
    const x1 = characterPosition.x;
    const y1 = characterPosition.y;
    const x2 = rayEnd.x;
    const y2 = rayEnd.y;

    let maxDistance = 0;
    let interceptFound = false;
    this.interceptSegment = -1;

    for (let i = 1; i < this.numPoints; i++) {
      const x3 = this.x[i];
      const y3 = this.y[i];
      const x4 = this.x[i - 1];
      const y4 = this.y[i - 1];

      const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (denom === 0) {
        continue;
      }
      const iX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
      const iY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;

      const interceptOnSegment = Obstacle.isPointInRange(iX, iY, x3, y3, x4, y4);
      const interceptOnRay = Obstacle.isPointInRange(iX, iY, x1, y1, x2, y2);

      if (interceptOnSegment && interceptOnRay) {
        const distanceToEndRay = new Vec2(iX, iY).subtract(new Vec2(x2, y2)).getLength();
        if (distanceToEndRay > maxDistance) {
          maxDistance = distanceToEndRay;
          this.interceptX = iX;
          this.interceptY = iY;
          interceptFound = true;
          this.interceptSegment = i;
        }
      }
    }

    return interceptFound ? new Vec2(this.interceptX, this.interceptY) : null;
  }

  /**
   * Bounding-box containment test on the segment (x1,y1)-(x2,y2).
   * NOTE: ported verbatim from Java, including its `1000 * (int)v` quantization — it truncates
   * each coordinate to an integer (toward zero) then scales by 1000, tolerating sub-unit float
   * error along nearly-axis-aligned edges. Preserved for behavioral parity; revisit if collision
   * feels off.
   */
  private static isPointInRange(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): boolean {
    const xMin = 1000 * Math.trunc(Math.min(x1, x2));
    const xMax = 1000 * Math.trunc(Math.max(x1, x2));
    const yMin = 1000 * Math.trunc(Math.min(y1, y2));
    const yMax = 1000 * Math.trunc(Math.max(y1, y2));

    const xInt = 1000 * Math.trunc(x);
    const yInt = 1000 * Math.trunc(y);

    return xInt >= xMin && xInt <= xMax && yInt >= yMin && yInt <= yMax;
  }

  /**
   * Given the last intercept, returns a point offset to the side of the hit edge by
   * `obstacleClearance`, choosing whichever side is nearer the character (so it steers around).
   */
  GetTarget(character: { position: Vec2 }, obstacleClearance: number): Vec2 {
    const x1 = this.x[this.interceptSegment];
    const y1 = this.y[this.interceptSegment];
    const x2 = this.x[this.interceptSegment - 1];
    const y2 = this.y[this.interceptSegment - 1];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const L = Math.sqrt(dx * dx + dy * dy);

    const deltaX = (obstacleClearance * dy) / L;
    const deltaY = (obstacleClearance * dx) / L;

    const point1 = new Vec2(this.interceptX + deltaX, this.interceptY - deltaY);
    const point2 = new Vec2(this.interceptX - deltaX, this.interceptY + deltaY);

    const distance1 = Vec2.copy(point1).subtract(character.position).getLength();
    const distance2 = Vec2.copy(point2).subtract(character.position).getLength();

    return distance1 < distance2 ? point1 : point2;
  }

  /** [minX, maxX] of the outline. */
  getRangeX(): [number, number] {
    let min = this.x[0];
    let max = this.x[0];
    for (let i = 1; i < this.x.length; i++) {
      if (this.x[i] > max) max = this.x[i];
      if (this.x[i] < min) min = this.x[i];
    }
    return [min, max];
  }

  /** [minY, maxY] of the outline. */
  getRangeY(): [number, number] {
    let min = this.y[0];
    let max = this.y[0];
    for (let i = 1; i < this.y.length; i++) {
      if (this.y[i] > max) max = this.y[i];
      if (this.y[i] < min) min = this.y[i];
    }
    return [min, max];
  }

  /** Flyover point: horizontally centered, just above the top of the obstacle. */
  computeFlyoverPoint(): number[] {
    const rangeX = this.getRangeX();
    const rangeY = this.getRangeY();
    const height = (rangeY[1] - rangeY[0]) * this.flyoverClearance;
    this.flyoverPoint = [(rangeX[0] + rangeX[1]) / 2, rangeY[0] - height];
    return this.flyoverPoint;
  }

  getFlyoverPoint(): number[] {
    return this.flyoverPoint;
  }

  /**
   * Marks (and reports) the obstacle as cleared once `position` comes within acceptedRange of the
   * flyover point. Takes a plain position so it stays decoupled from Bird. Latches on cleared.
   */
  isCleared(position: Vec2): boolean {
    if (this.hasBeenCleared) {
      return true;
    }
    const flyoverVector = new Vec2(this.flyoverPoint[0], this.flyoverPoint[1]);
    const distanceFromFlyover = flyoverVector.subtract(position).getLength();
    this.hasBeenCleared = distanceFromFlyover <= this.acceptedRange;
    return this.hasBeenCleared;
  }
}

/** Isosceles triangle obstacle (base 1, given height), apex pointing up (-y). */
export class TriangleObstacle extends Obstacle {
  constructor(height: number) {
    super();
    const base = 1;
    this.set([
      [0, 0],
      [base, 0],
      [base / 2, -height],
      [0, 0],
    ]);
  }
}

/** Axis-aligned rectangle obstacle (base 1, given height), extending up (-y). */
export class RectangleObstacle extends Obstacle {
  constructor(height: number) {
    super();
    const base = 1;
    this.set([
      [0, 0],
      [base, 0],
      [base, -height],
      [0, -height],
      [0, 0],
    ]);
  }
}
