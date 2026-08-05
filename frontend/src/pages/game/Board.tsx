import { TestCircle } from "../shapes/TestCircle";
import { Circle } from "../shapes/Circle";

const BOARD_SIZE = 1500;

const ARM_CELLS = 13;                              // cells on the inward scallop
const CORNER_CELLS = 5;                            // cells rounding the corner
const CELLS_PER_ARM = ARM_CELLS + CORNER_CELLS;    // 18
export const TOTAL_CELLS = CELLS_PER_ARM * 4;      // 72

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

export function Board({ size = 1500, boardSize = BOARD_SIZE }) {
  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

  return (
    <svg viewBox={`0 0 ${boardSize} ${boardSize}`} style={{ width: size, height: size }}>
      <rect x={0} y={0} width={boardSize} height={boardSize} fill="white" />
      {cells.map((i) => {
        const { x, y } = computeCoordsFromIndex({ index: i, boardSize });
        return (
          <Circle
            key={i}
            r={20}
            cx={x}
            cy={y}
            fill="none"
            stroke="black"
            strokeWidth={4}
            label={i + 1}
          />
        );
      })}
    </svg>
  );
}
