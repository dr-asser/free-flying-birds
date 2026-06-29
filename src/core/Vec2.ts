/**
 * 2D vector. Port of the Java `VectorSpace2D`.
 *
 * Deliberately MUTABLE: `add`/`subtract`/`multiplyScalar`/`normalize` mutate in place and return
 * `this`, matching the original so call sites that rely on copy-then-mutate (`Vec2.copy(v).add(w)`)
 * port without behavioral change. Java's overloaded constructors become static factories
 * (`fromAngle`, `copy`), since TypeScript has no constructor overloading.
 *
 * Angle convention is screen-space y-down: `getAngle()` uses `atan2(-y, x) + PI/2`, and
 * `fromAngle(a)` returns `(sin a, cos a)`. The two are inverses on `(-PI, PI]`.
 */
export class Vec2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /** Unit vector for an angle (y-down convention). Replaces `new VectorSpace2D(float angle)`. */
  static fromAngle(angle: number): Vec2 {
    return new Vec2(Math.sin(angle), Math.cos(angle));
  }

  /** Copy of another vector. Replaces `new VectorSpace2D(VectorSpace2D)`. */
  static copy(v: Vec2): Vec2 {
    return new Vec2(v.x, v.y);
  }

  getLength(): number {
    return Math.hypot(this.x, this.y);
  }

  /** Mutates to unit length and returns this. */
  normalize(): this {
    const length = this.getLength();
    this.x /= length;
    this.y /= length;
    return this;
  }

  /** Mutates by scaling and returns this. */
  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /** Mutates by adding and returns this. */
  add(v: Vec2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /** Mutates by subtracting and returns this. */
  subtract(v: Vec2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /** Angle the vector subtends, y-down convention. */
  getAngle(): number {
    return Math.atan2(-this.y, this.x) + Math.PI / 2;
  }

  toString(): string {
    return `x=${this.x} y=${this.y} r=${this.getLength()} theta=${this.getAngle()}`;
  }
}
