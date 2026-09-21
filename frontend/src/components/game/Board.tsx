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

/** Size of the index written inside a cell, in board units. */
const INDEX_FONT_SIZE = 22;

/** The number written inside a cell, once the pen has finished drawing it. */
function CellIndex({
  x,
  y,
  label,
  delay,
}: {
  x: number;
  y: number;
  label: string;
  delay: number;
}) {
  return (
    <motion.text
      x={x}
      y={y}
      className="font-body"
      fill="var(--foreground)"
      fontSize={INDEX_FONT_SIZE}
      textAnchor="middle"
      dominantBaseline="central"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      transition={{ delay, duration: 0.2 }}
    >
      {label}
    </motion.text>
  );
}

type BoardProps = {
  boardSize?: number;
  /** Writes the index of every cell inside it — handy to check the geometry. */
  showIndexes?: boolean;
  /** Drawn on top of the board, in board coordinates — the pawns go here. */
  children?: ReactNode;
};

export function Board({
  boardSize = BOARD_SIZE,
  showIndexes = true,
  children,
}: BoardProps) {
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
          <g key={`cell-${i}`}>
            <motion.path
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

            {showIndexes && (
              <CellIndex
                x={x}
                y={y}
                label={String(i)}
                delay={timing.delay + timing.duration}
              />
            )}
          </g>
        );
      })}

      {/* FOUR HOME PATHS */}
      {homeCells.map((i) => {
        const { x, y } = computeHomeCoords(i, boardSize);

        const seat = Math.floor(i / HOME_CELLS);
        const color = TEAM_COLORS[seat];

        const path = handDrawnCirclePath(x, y, CELL_RADIUS, 1000 + i);

        return (
          <g key={`home-${i}`}>
            <motion.path
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

            {/* prefixed, because homes have their own numbering */}
            {showIndexes && (
              <CellIndex x={x} y={y} label={`H${i}`} delay={i * 0.08 + 0.25} />
            )}
          </g>
        );
      })}

      {/* FOUR SPAWNS */}
      {spawnCells.map((i) => {
        const { x, y } = computeSpawnCoords(i, boardSize);

        const seat = Math.floor(i / SPAWN_CELLS);
        const color = TEAM_COLORS[seat];

        const path = handDrawnCirclePath(x, y, CELL_RADIUS, 2000 + i);

        return (
          <g key={`spawn-${i}`}>
            <motion.path
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

            {/* prefixed, because spawns have their own numbering */}
            {showIndexes && (
              <CellIndex x={x} y={y} label={`S${i}`} delay={i * 0.08 + 0.25} />
            )}
          </g>
        );
      })}

      {children}
    </svg>
  );
}
