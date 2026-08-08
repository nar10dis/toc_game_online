import { TestCircle } from "../shapes/TestCircle";
import { Circle } from "../shapes/Circle";
import { motion } from "motion/react";

const BOARD_SIZE = 1500;

const ARM_CELLS = 13;                              // cells on the inward scallop
const CORNER_CELLS = 5;                            // cells rounding the corner
const CELLS_PER_ARM = ARM_CELLS + CORNER_CELLS;    // 18
export const TOTAL_CELLS = CELLS_PER_ARM * 4;      // 72

const HOME_CELLS = 4;

const TEAM_COLORS = [
  "#d95757", // top
  "#4d82b8", // right
  "#d3a936", // bottom
  "#57936f", // left
];

const HOME_CELL_SPACING = 80;

function computeHomeCoords(
    homeIndex: number,
    boardSize = BOARD_SIZE
) {
  const g = geometry(boardSize);

  const team = Math.floor(homeIndex / HOME_CELLS);
  const cell = homeIndex % HOME_CELLS;

  // Tile 15 of this arm.
  const cell15 = computeCoordsFromIndex({
    index: team * CELLS_PER_ARM + 15,
    boardSize,
  });

  // Direction from tile 15 toward the center.
  const dx = g.c - cell15.x;
  const dy = g.c - cell15.y;

  const length = Math.hypot(dx, dy);

  const dirX = dx / length;
  const dirY = dy / length;

  // Start just inside tile 15 and continue toward the center.
  const distance = (cell + 1) * HOME_CELL_SPACING;

  return {
    x: cell15.x + dirX * distance,
    y: cell15.y + dirY * distance,
  };
}

// geometry, as fractions of the board so everything scales together
const ARM_RADIUS = 350 / 1500;   // radius of the scallop
const ARM_INSET = 90 / 1500;     // scallop centre's distance from the top edge
const CORNER_RADIUS = 240 / 1500;

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

const polar = (cx, cy, r, angle) => ({
  x: cx + r * Math.cos(rad(angle)),
  y: cy + r * Math.sin(rad(angle)),
});

// quarter-turn rotation about the board centre (clockwise on screen, y is down)
function rotate({ x, y }, quarters, c) {
  const a = rad(90 * quarters);
  const dx = x - c;
  const dy = y - c;
  return {
    x: c + dx * Math.cos(a) - dy * Math.sin(a),
    y: c + dx * Math.sin(a) + dy * Math.cos(a),
  };
}

function geometry(boardSize) {
  const c = boardSize / 2;
  const rArm = boardSize * ARM_RADIUS;
  const armY = boardSize * ARM_INSET;
  const rCorner = boardSize * CORNER_RADIUS;

  // the corner arc joins the last scallop cell to the first cell of the next arm
  const p = polar(c, armY, rArm, 0);
  const q = rotate(polar(c, armY, rArm, 180), 1, c);

  const mx = (p.x + q.x) / 2;
  const my = (p.y + q.y) / 2;
  const half = Math.hypot(q.x - p.x, q.y - p.y) / 2;
  const sagitta = Math.sqrt(Math.max(rCorner ** 2 - half ** 2, 0));

  // push the centre inward along board-centre -> chord-midpoint, so the arc bulges out
  const len = Math.hypot(mx - c, my - c);
  const ox = mx - (sagitta * (mx - c)) / len;
  const oy = my - (sagitta * (my - c)) / len;

  let start = deg(Math.atan2(p.y - oy, p.x - ox));
  let end = deg(Math.atan2(q.y - oy, q.x - ox));
  while (end - start > 180) end -= 360;
  while (end - start < -180) end += 360;

  return { c, rArm, armY, rCorner, ox, oy, start, end };
}

export function computeCoordsFromIndex({ index, boardSize = BOARD_SIZE }) {
  const g = geometry(boardSize);
  const arm = Math.floor(index / CELLS_PER_ARM) % 4;
  const i = index % CELLS_PER_ARM;

  const local =
    i < ARM_CELLS
      ? polar(g.c, g.armY, g.rArm, 180 - i * (180 / (ARM_CELLS - 1)))
      : polar(
          g.ox,
          g.oy,
          g.rCorner,
          g.start + (g.end - g.start) * ((i - ARM_CELLS + 1) / (CORNER_CELLS + 1))
        );

  return rotate(local, arm, g.c);
}

function calculateDrawTimings(
    cells: number[],
    boardSize: number
) {
  const DRAW_DURATION = 0.18;
  const PEN_SPEED = 2000;

  const timings = new Array(TOTAL_CELLS);

  // Four independent pens.
  for (let arm = 0; arm < 4; arm++) {
    const startIndex = arm * CELLS_PER_ARM;
    const endIndex = startIndex + CELLS_PER_ARM;

    let elapsed = 0;

    for (let index = startIndex; index < endIndex; index++) {
      const current = computeCoordsFromIndex({
        index,
        boardSize,
      });

      // Move from the previous cell of THIS arm.
      if (index > startIndex) {
        const previous =
            computeCoordsFromIndex({
              index: index - 1,
              boardSize,
            });

        const distance = Math.hypot(
            current.x - previous.x,
            current.y - previous.y
        );

        elapsed += distance / PEN_SPEED;
      }

      timings[index] = {
        delay: elapsed,
        duration: DRAW_DURATION,
      };

      elapsed += DRAW_DURATION;
    }
  }

  return timings;
}

function handDrawnCirclePath(
    cx: number,
    cy: number,
    r: number,
    seed: number
) {
  const points = 32;
  const result: string[] = [];

  const random = (n: number) => {
    const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const angle = t * Math.PI * 2;

    const wobble =
        (random(i + seed * 10) - 0.5) * 0.8 +
        Math.sin(angle * 3 + seed) * 0.7 +
        Math.sin(angle * 7 + seed * 2.3) * 0.3;

    const radius = r + wobble;

    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    if (i === 0) {
      result.push(`M ${x} ${y}`);
    } else {
      result.push(`L ${x} ${y}`);
    }
  }

  return result.join(" ");
}

export function Board({boardSize = BOARD_SIZE}) {
  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

  const homeCells = Array.from(
      { length: 4 * HOME_CELLS },
      (_, i) => i
  );

  const timings = calculateDrawTimings( cells, boardSize );

  return (
    <svg viewBox={`0 0 ${boardSize} ${boardSize}`} style={{
      width: "90vmin",
      height: "auto",
      display: "block"
    }}>
      <defs>
        <filter id="handDrawn">
          <feTurbulence
              type="fractalNoise"
              baseFrequency="0.15"
              numOctaves="2"
              seed="3"
              result="noise"
          />

        </filter>
      </defs>

      {cells.map((i) => {
        const { x, y } = computeCoordsFromIndex({ index: i, boardSize });
        const path = handDrawnCirclePath(
            x,
            y,
            25,
            i
        );
        const timing = timings[i];

        return (
          <motion.path
              d={path}
              fill="none"
              stroke="#29251f"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{
                pathLength: 0,
                opacity: 0,
              }}
              animate={{
                pathLength: 1,
                opacity: 0.9,
              }}
              transition={{ delay: timing.delay, duration: timing.duration}}
          />
        );
      })}

      {/* FOUR HOME PATHS */}
      {homeCells.map((i) => {
        const { x, y } = computeHomeCoords(
            i,
            boardSize
        );

        const team = Math.floor(i / HOME_CELLS);
        const color = TEAM_COLORS[team];

        const path = handDrawnCirclePath(
            x,
            y,
            25,
            1000 + i
        );

        return (
            <motion.path
                key={`home-${i}`}
                d={path}
                fill={color}
                fillOpacity={0.22}
                stroke={color}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{
                  pathLength: 0,
                  opacity: 0,
                }}
                animate={{
                  pathLength: 1,
                  opacity: 0.9,
                }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.25,
                  ease: "easeOut",
                }}
            />
        );
      })}
    </svg>
  );
}
