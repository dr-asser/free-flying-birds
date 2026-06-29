/** RGB color with components in [0, 1], matching the Java `Vector3f` colors. */
export interface Color {
  r: number;
  g: number;
  b: number;
}

export const WHITE: Color = { r: 1, g: 1, b: 1 };
export const YELLOW: Color = { r: 1, g: 1, b: 0 }; // follower birds
export const RED: Color = { r: 1, g: 0, b: 0 }; // leader bird
export const BROWN: Color = { r: 0.5, g: 0, b: 0 }; // dead bird
