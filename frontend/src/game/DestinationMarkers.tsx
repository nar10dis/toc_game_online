import { motion } from "motion/react";

import {
  BOARD_SIZE,
  CELL_RADIUS,
  HOME_CELLS,
  computeCoordsFromIndex,
  computeHomeCoords,
  type Point,
} from "@/game/boardGeometry";
import type { LegalMove, PawnPosition } from "@/game/gameTypes";
import { handDrawnCirclePath } from "@/game/handDrawn";

/** Centre of the cell a move lands on. */
function getCellCoords(position: PawnPosition, seat: number, boardSize: number): Point {
  if (position.zone === "home") {
    return computeHomeCoords(seat * HOME_CELLS + position.cell, boardSize);
  }
  if (position.zone === "board") {
    return computeCoordsFromIndex({ index: position.cell, boardSize });
  }
  return { x: 0, y: 0 };
}

type DestinationMarkersProps = {
  destinations: LegalMove[];
  color: string;
  /** Seat of the pawn being moved, to find its home. */
  seat: number;
  onClick: (move: LegalMove) => void;
  /** Must match the `boardSize` of the `Board` these are drawn in. */
  boardSize?: number;
};

/** A dashed ring on every cell the selected pawn can go to. Goes inside a `Board`. */
export function DestinationMarkers({
  destinations,
  color,
  seat,
  onClick,
  boardSize = BOARD_SIZE,
}: DestinationMarkersProps) {
  return (
    <g>
      {destinations.map((move, index) => {
        if (!move.to) return null;
        const { x, y } = getCellCoords(move.to, seat, boardSize);

        return (
          <motion.path
            key={`destination-${index}`}
            d={handDrawnCirclePath(x, y, CELL_RADIUS + 8, 4000 + index)}
            //filled, even if see-through, so the whole ring catches the click
            fill={color}
            fillOpacity={0.25}
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray="16 14"
            style={{ cursor: "pointer" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.9, scale: 1 }}
            whileHover={{ scale: 1.15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => onClick(move)}
          />
        );
      })}
    </g>
  );
}
