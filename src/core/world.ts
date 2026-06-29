/**
 * World layout constants — the single source of truth for the game's coordinate space.
 *
 * Mirrors the fields of the Java `Game` class:
 *   width=1200, height=600, xBand=100, yBand=xBand*height/width=50,
 *   xMin=xBand=100, xMax=width-xBand=1100, yMin=yBand=50, yMax=height-yBand=550.
 *
 * The visible rectangle is [XMIN, XMAX] x [YMIN, YMAX]; the full window/world bounds used for
 * boundary clamping are [0, WIDTH] x [0, HEIGHT]. The render `Camera` derives its transform from
 * these, so core and render never disagree about the coordinate space.
 */
export const World = {
  WIDTH: 1200,
  HEIGHT: 600,
  XBAND: 100,
  YBAND: 50,
  XMIN: 100,
  XMAX: 1100,
  YMIN: 50,
  YMAX: 550,
} as const;
