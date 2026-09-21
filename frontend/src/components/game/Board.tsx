import type { ReactNode } from "react";
import { motion } from "motion/react";

import {
  BOARD_SIZE,
  CELL_RADIUS,
  CELLS_PER_ARM,
  HOME_CELLS,
  SPAWN_CELLS,
  TEAM_COLORS,
  TEAMS_NUMBER,
  TOTAL_CELLS,
  computeCoordsFromIndex,
  computeHomeCoords,
  computeSpawnCoords,
  getSeatOfStartCell,
} from "@/game/boardGeometry";
import { handDrawnCirclePath } from "@/game/handDrawn";

/** How long the pen takes to draw one cell. */
const DRAW_DURATION = 0.18;
/** How fast the pen travels between two cells, in board units per second. */
const PEN_SPEED = 2000;

function calculateDrawTimings(boardSize: number) {
  const timings = new Array(TOTAL_CELLS);

  // Four independent pens.
  for (let arm = 0; arm < TEAMS_NUMBER; arm++) {
    const startIndex = arm * CELLS_PER_ARM;
    const endIndex = startIndex + CELLS_PER_ARM;

    let elapsed = 0;

    for (let index = startIndex; index < endIndex; index++) {
      const current = computeCoordsFromIndex({ index, boardSize });

      // Move from the previous cell of THIS arm.
      if (index > startIndex) {
        const previous = computeCoordsFromIndex({ index: index - 1, boardSize });

        const distance = Math.hypot(
          current.x - previous.x,
          current.y - previous.y,
        );

        elapsed += distance / PEN_SPEED;
      }

      timings[index] = { delay: elapsed, duration: DRAW_DURATION };

      elapsed += DRAW_DURATION;
    }
  }

  return timings;
}

type BoardProps = {
  boardSize?: number;
  /** Drawn on top of the board, in board coordinates — the pawns go here. */
  children?: ReactNode;
};

export function Board({ boardSize = BOARD_SIZE, children }: BoardProps) {
  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

  const homeCells = Array.from({ length: TEAMS_NUMBER * HOME_CELLS }, (_, i) => i);

  const spawnCells = Array.from({ length: TEAMS_NUMBER * SPAWN_CELLS }, (_, i) => i);

  const timings = calculateDrawTimings(boardSize);

  return (
    <svg
      viewBox={`0 0 ${boardSize} ${boardSize}`}
      style={{ width: "90vmin", height: "auto", display: "block" }}
    >
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
        const path = handDrawnCirclePath(x, y, CELL_RADIUS, i);
        const timing = timings[i];

        //a start cell wears the colour of the seat that comes out on it.
        const startCellSeat = getSeatOfStartCell(i);
        const isStartCell = startCellSeat >= 0;
        const color = isStartCell ? TEAM_COLORS[startCellSeat] : "var(--foreground)";

        return (
          <motion.path
            key={`cell-${i}`}
            d={path}
            fill={color}
            fillOpacity={isStartCell ? 0.3 : 0}
            stroke={color}
            strokeWidth={isStartCell ? 7 : 5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ delay: timing.delay, duration: timing.duration }}
          />
        );
      })}

      {/* FOUR HOME PATHS */}
      {homeCells.map((i) => {
        const { x, y } = computeHomeCoords(i, boardSize);

        const seat = Math.floor(i / HOME_CELLS);
        const color = TEAM_COLORS[seat];

        const path = handDrawnCirclePath(x, y, CELL_RADIUS, 1000 + i);

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
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ delay: i * 0.08, duration: 0.25, ease: "easeOut" }}
          />
        );
      })}

      {/* FOUR SPAWNS */}
      {spawnCells.map((i) => {
        const { x, y } = computeSpawnCoords(i, boardSize);

        const seat = Math.floor(i / SPAWN_CELLS);
        const color = TEAM_COLORS[seat];

        const path = handDrawnCirclePath(x, y, CELL_RADIUS, 2000 + i);

        return (
          <motion.path
            key={`spawn-${i}`}
            d={path}
            fill={color}
            fillOpacity={0.18}
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ delay: i * 0.08, duration: 0.25, ease: "easeOut" }}
          />
        );
      })}

      {children}
    </svg>
  );
}
