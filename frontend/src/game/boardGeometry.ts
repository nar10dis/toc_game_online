/**
 * Where every cell of the board sits.
 *
 * Pure geometry: no React. Coordinates are in board units — the board is drawn
 * in a square `viewBox` of `boardSize`, so everything scales together and a
 * pawn placed at these coordinates lands exactly on its cell.
 */

/* ************************************************************************** */
/*                                 CONST DEF                                  */
/* ************************************************************************** */

export const BOARD_SIZE = 1500;

export const TEAMS_NUMBER = 4;

/** Cells on the inward scallop of one arm. */
const ARM_CELLS = 13;
/** Cells rounding the corner between two arms. */
const CORNER_CELLS = 5;
export const CELLS_PER_ARM = ARM_CELLS + CORNER_CELLS;
export const TOTAL_CELLS = CELLS_PER_ARM * TEAMS_NUMBER;

export const HOME_CELLS = 4;
export const SPAWN_CELLS = 4;
/** One pawn per cell of the spawn zone. */
export const PAWNS_PER_TEAM = SPAWN_CELLS;

/**
 * Team colours, in team order: top, right, bottom, left. The values live in
 * globals.css (--team-0 to --team-3) so they follow the light and dark themes.
 */
export const TEAM_COLORS = [
  "var(--team-0)", // top
  "var(--team-1)", // right
  "var(--team-2)", // bottom
  "var(--team-3)", // left
];

/** Radius of the circle drawn for one cell. */
export const CELL_RADIUS = 25;

const HOME_CELL_SPACING = 80;

const SPAWN_SPACING = 70;
const SPAWN_OFFSET = -180;

// geometry, as fractions of the board so everything scales together
const ARM_RADIUS = 350 / 1500;   // radius of the scallop
const ARM_INSET = 90 / 1500;     // scallop centre's distance from the top edge
const CORNER_RADIUS = 240 / 1500;

/* ************************************************************************** */
/*                                 TYPE DEF                                   */
/* ************************************************************************** */

export type Point = { x: number; y: number };

/* ************************************************************************** */
/*                                   MATHS                                    */
/* ************************************************************************** */

const rad = (degrees: number) => (degrees * Math.PI) / 180;
const deg = (radians: number) => (radians * 180) / Math.PI;

const polar = (cx: number, cy: number, r: number, angle: number): Point => ({
  x: cx + r * Math.cos(rad(angle)),
  y: cy + r * Math.sin(rad(angle)),
});

// quarter-turn rotation about the board centre (clockwise on screen, y is down)
function rotate({ x, y }: Point, quarters: number, c: number): Point {
  const a = rad(90 * quarters);
  const dx = x - c;
  const dy = y - c;
  return {
    x: c + dx * Math.cos(a) - dy * Math.sin(a),
    y: c + dx * Math.sin(a) + dy * Math.cos(a),
  };
}

function geometry(boardSize: number) {
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

/* ************************************************************************** */
/*                              CELL COORDINATES                              */
/* ************************************************************************** */

/** Centre of cell `index` of the track, from 0 to `TOTAL_CELLS - 1`. */
export function computeCoordsFromIndex({
  index,
  boardSize = BOARD_SIZE,
}: {
  index: number;
  boardSize?: number;
}): Point {
  const g = geometry(boardSize);
  const arm = Math.floor(index / CELLS_PER_ARM) % TEAMS_NUMBER;
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

/** A point `distance` down the line that runs from tile 15 of the arm to the centre. */
function walkHomeLine(
  team: number,
  distance: number,
  boardSize: number
): Point {
  const g = geometry(boardSize);

  // Tile 15 of this arm.
  const cell15 = computeCoordsFromIndex({
    index: team * CELLS_PER_ARM + 15,
    boardSize,
  });

  // Direction from tile 15 toward the center.
  const dx = g.c - cell15.x;
  const dy = g.c - cell15.y;

  const length = Math.hypot(dx, dy);

  return {
    x: cell15.x + (dx / length) * distance,
    y: cell15.y + (dy / length) * distance,
  };
}

/** Centre of home cell `homeIndex`, from 0 to `TEAMS_NUMBER * HOME_CELLS - 1`. */
export function computeHomeCoords(
  homeIndex: number,
  boardSize = BOARD_SIZE
): Point {
  const team = Math.floor(homeIndex / HOME_CELLS);
  const cell = homeIndex % HOME_CELLS;

  // Start just inside tile 15 and continue toward the center.
  return walkHomeLine(team, (cell + 1) * HOME_CELL_SPACING, boardSize);
}

/** How far past the spawn zone the team's picture sits, away from the centre. */
const AVATAR_OFFSET = 118;

/**
 * Extra push for the right and left teams: their name is written across the
 * spawn column, so the picture moves out until the name clears the pawns.
 */
const SIDE_AVATAR_EXTRA_OFFSET = 30;

/**
 * Where the team's picture sits: right outside its spawn zone, on the way out
 * of the board — above the top team, left of the left one, and so on.
 */
export function computeAvatarCoords(team: number, boardSize = BOARD_SIZE): Point {
  const g = geometry(boardSize);
  const scale = boardSize / BOARD_SIZE;

  const isSideTeam = team % 2 === 1;
  const offset = AVATAR_OFFSET + (isSideTeam ? SIDE_AVATAR_EXTRA_OFFSET : 0);

  // Top spawn, then one step further from the centre.
  const local = {
    x: g.c,
    y: g.armY - (SPAWN_OFFSET + offset) * scale,
  };

  // Rotate top → right → bottom → left.
  return rotate(local, team, g.c);
}

/** Centre of spawn cell `spawnIndex`, from 0 to `TEAMS_NUMBER * SPAWN_CELLS - 1`. */
export function computeSpawnCoords(
  spawnIndex: number,
  boardSize = BOARD_SIZE
): Point {
  const g = geometry(boardSize);

  const team = Math.floor(spawnIndex / SPAWN_CELLS);
  const cell = spawnIndex % SPAWN_CELLS;

  const scale = boardSize / BOARD_SIZE;

  const spacing = SPAWN_SPACING * scale;
  const offset = SPAWN_OFFSET * scale;

  // Four cells centered around the middle of the arm.
  const along = (cell - (SPAWN_CELLS - 1) / 2) * spacing;

  // Top spawn.
  const local = {
    x: g.c + along,
    y: g.armY - offset,
  };

  // Rotate top → right → bottom → left.
  return rotate(local, team, g.c);
}

/* ************************************************************************** */
/*                             TEAMS AND THE TRACK                            */
/* ************************************************************************** */

/**
 * Cell a pawn of `team` enters the track on: the first cell of the next arm,
 * which is the one with the team's own home zone drawn behind it.
 */
export function getStartCellIndex(team: number): number {
  return ((team + 1) % TEAMS_NUMBER) * CELLS_PER_ARM;
}

/** Team owning the start cell `cellIndex`, or -1 when it is a plain cell. */
export function getTeamOfStartCell(cellIndex: number): number {
  if (cellIndex % CELLS_PER_ARM !== 0) return -1;

  const arm = cellIndex / CELLS_PER_ARM;
  return (arm + TEAMS_NUMBER - 1) % TEAMS_NUMBER;
}

/** Index of the spawn cell `slot` of `team`, used to place a waiting pawn. */
export function getSpawnCellIndex(team: number, slot: number): number {
  return team * SPAWN_CELLS + slot;
}

/** Every cell a pawn walks over, the destination last. Wraps around the track. */
export function getTravelPath(fromCellIndex: number, steps: number): number[] {
  const path: number[] = [];

  for (let step = 1; step <= steps; step++) {
    path.push((fromCellIndex + step) % TOTAL_CELLS);
  }

  return path;
}
