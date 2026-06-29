import { Vec2 } from "../core/Vec2";

/**
 * Low-level Canvas drawing helpers, all in pixel space. These replace the original immediate-mode
 * OpenGL calls (glBegin(GL_POLYGON)/glVertex/glEnd, line loops for circles). Callers convert world
 * coordinates to pixels (via Camera) before calling in here.
 */

/** Filled polygon from pixel-space points. */
export function fillPolygon(ctx: CanvasRenderingContext2D, points: Vec2[], color: string): void {
  if (points.length === 0) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fill();
}

/** Stroked (outline) circle. */
export function strokeCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  lineWidth = 1,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

/** Filled circle. */
export function fillCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** Polyline through pixel-space points. */
export function strokePolyline(
  ctx: CanvasRenderingContext2D,
  points: Vec2[],
  color: string,
  lineWidth = 1,
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

/** Text at a pixel position. Replaces the hand-rolled bitmap font (SimpleTextInv). */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  font = "14px monospace",
): void {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.fillText(text, x, y);
}
