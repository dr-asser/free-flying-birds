import { Vec2 } from "./Vec2";

/**
 * A polyline path with arc-length parameterization. Port of Java `Path`.
 *
 * `pathLength[i]` is the cumulative distance to vertex i. `getLengthAlongPath` projects a position
 * onto the nearest relevant segment to find how far along the path it is; `getPosition` maps an
 * arc length back to a world point. Rendering lives in the render layer.
 */
export class Path {
  x: number[];
  y: number[];
  numPoints: number;
  pathLength: number[];

  constructor(coordinates: number[][]) {
    this.numPoints = coordinates.length;
    this.x = new Array(this.numPoints);
    this.y = new Array(this.numPoints);
    for (let i = 0; i < this.numPoints; i++) {
      this.x[i] = coordinates[i][0];
      this.y[i] = coordinates[i][1];
    }
    this.pathLength = new Array(this.numPoints);
    this.pathLength[0] = 0;
    for (let j = 1; j < this.numPoints; j++) {
      const segment = new Vec2(this.x[j], this.y[j])
        .subtract(new Vec2(this.x[j - 1], this.y[j - 1]))
        .getLength();
      this.pathLength[j] = this.pathLength[j - 1] + segment;
    }
  }

  /**
   * Projects `position` onto the path and returns its arc length, searching from the segment that
   * `length` (the previous arc length) falls in. Per http://www.exaflop.org/docs/cgafaq/cga1.html.
   */
  getLengthAlongPath(position: Vec2, length: number): number {
    if (length < this.pathLength[0]) {
      return this.pathLength[0];
    }
    if (length > this.pathLength[this.numPoints - 1]) {
      return this.pathLength[this.numPoints - 1];
    }

    let I = 0;
    for (let i = 1; i < this.numPoints; i++) {
      if (length <= this.pathLength[i]) {
        I = i;
        break;
      }
    }

    const l = this.pathLength[I] - this.pathLength[I - 1];
    const r =
      ((this.y[I - 1] - position.y) * (this.y[I - 1] - this.y[I]) -
        (this.x[I - 1] - position.x) * (this.x[I] - this.x[I - 1])) /
      (l * l);

    return this.pathLength[I - 1] + r * l;
  }

  /** World point at the given arc length along the path. */
  getPosition(length: number): Vec2 {
    if (length < this.pathLength[0]) {
      return new Vec2(this.x[0], this.y[0]);
    }
    if (length > this.pathLength[this.numPoints - 1]) {
      return new Vec2(this.x[this.numPoints - 1], this.y[this.numPoints - 1]);
    }
    let I = 0;
    for (let i = 1; i < this.numPoints; i++) {
      if (length <= this.pathLength[i]) {
        I = i;
        break;
      }
    }
    const l = this.pathLength[I] - this.pathLength[I - 1];
    const r = (length - this.pathLength[I - 1]) / l;
    const xPoint = this.x[I - 1] + r * (this.x[I] - this.x[I - 1]);
    const yPoint = this.y[I - 1] + r * (this.y[I] - this.y[I - 1]);
    return new Vec2(xPoint, yPoint);
  }
}
