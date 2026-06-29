/**
 * Small seedable PRNG, replacing `java.util.Random`. Seeding makes levels and tests reproducible.
 *
 * `next()` returns a float in [0, 1), matching how the Java code used `rand.nextFloat()`.
 * Uses the mulberry32 algorithm: fast, tiny, and good enough for procedural scene generation.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    // Force to a 32-bit unsigned integer state.
    this.state = seed >>> 0;
  }

  /** Float in [0, 1). Equivalent in role to Java's Random.nextFloat(). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
