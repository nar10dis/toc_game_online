/** The wobbly, pen-drawn look shared by the cells, the pawns and their trail. */

import type { Point } from "@/lib/game/boardGeometry";

/** Always the same number for the same inputs, so a drawing never flickers. */
function pseudoRandom(n: number, seed: number): number {
  const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Node and the browser disagree on the last digits of `Math.sin`, and React
 * then complains the page it rendered on the server does not match. Two
 * decimals are far more than a pen needs anyway.
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** An `SVG` path of a circle that looks drawn by hand. `seed` varies the wobble. */
export function handDrawnCirclePath(
  cx: number,
  cy: number,
  r: number,
  seed: number,
): string {
  const points = 32;
  const result: string[] = [];

  const random = (n: number) => pseudoRandom(n, seed);

  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const angle = t * Math.PI * 2;

    const wobble =
      (random(i + seed * 10) - 0.5) * 0.8 +
      Math.sin(angle * 3 + seed) * 0.7 +
      Math.sin(angle * 7 + seed * 2.3) * 0.3;

    const radius = r + wobble;

    const x = round(cx + Math.cos(angle) * radius);
    const y = round(cy + Math.sin(angle) * radius);

    if (i === 0) {
      result.push(`M ${x} ${y}`);
    } else {
      result.push(`L ${x} ${y}`);
    }
  }

  return result.join(" ");
}

/** How far the line bends away from a straight segment, at its middle. */
const LINE_BOW = 14;
/** How much the pen shakes along the way. */
const LINE_JITTER = 6;
/** Points drawn between two stops — enough to make the bend look smooth. */
const POINTS_PER_SEGMENT = 8;

/**
 * An `SVG` path running through `stops` the way a hand would draw it: each leg
 * bows to one side, then the other, with a little shake on top.
 */
export function handDrawnLinePath(stops: Point[], seed = 1): string {
  if (stops.length < 2) return "";

  const result = [`M ${round(stops[0].x)} ${round(stops[0].y)}`];

  for (let leg = 1; leg < stops.length; leg++) {
    const from = stops[leg - 1];
    const to = stops[leg];

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);

    //a zero-length leg has no side to bow towards, so skip it.
    if (length === 0) continue;

    // sideways direction of this leg
    const sideX = -dy / length;
    const sideY = dx / length;

    // legs bow left, then right, so the trail wanders instead of zig-zagging
    const bow = leg % 2 === 0 ? LINE_BOW : -LINE_BOW;

    for (let step = 1; step <= POINTS_PER_SEGMENT; step++) {
      const t = step / POINTS_PER_SEGMENT;

      const shake = (pseudoRandom(leg * 100 + step, seed) - 0.5) * LINE_JITTER;
      const offset = Math.sin(t * Math.PI) * bow + shake;

      const x = round(from.x + dx * t + sideX * offset);
      const y = round(from.y + dy * t + sideY * offset);

      result.push(`L ${x} ${y}`);
    }
  }

  return result.join(" ");
}
