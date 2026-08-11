import { useState } from "react";
import { AnimatePresence } from "motion/react";

import {
  BOARD_SIZE,
  TEAM_COLORS,
  computeCoordsFromIndex,
  computeSpawnCoords,
  getSpawnCellIndex,
  type Point,
} from "@/game/boardGeometry";
import { MovePreview } from "@/game/MovePreview";
import { Pawn } from "@/game/Pawn";
import { getPawnTravelPath, type Pawn as PawnData } from "@/game/usePawns";

/** No pawn is hovered right now. */
const NO_PAWN = -1;

/* ************************************************************************** */
/*                                 GEOMETRY                                   */
/* ************************************************************************** */

/** Where the pawn stands: its cell of the spawn zone, or its cell of the track. */
function getPawnPosition(pawn: PawnData, boardSize: number): Point {
  if (pawn.zone === "spawn") {
    return computeSpawnCoords(
      getSpawnCellIndex(pawn.team, pawn.spawnSlot),
      boardSize,
    );
  }

  return computeCoordsFromIndex({ index: pawn.cellIndex, boardSize });
}

/** Where the pawn stands, then every cell the card would walk it over. */
function getPreviewStops(
  pawn: PawnData,
  moveDistance: number,
  boardSize: number,
): Point[] {
  const travelPath = getPawnTravelPath(pawn, moveDistance);

  const stops = travelPath.map((cellIndex) =>
    computeCoordsFromIndex({ index: cellIndex, boardSize }),
  );

  return [getPawnPosition(pawn, boardSize), ...stops];
}

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

type PawnLayerProps = {
  pawns: PawnData[];
  /** Pawns the player may click. They shine. */
  selectablePawnIds?: number[];
  /** Cells the played card moves a pawn, used to draw the trail on hover. */
  moveDistance?: number;
  /** Must match the `boardSize` of the `Board` this layer is drawn in. */
  boardSize?: number;
  onPawnClick?: (pawnId: number) => void;
  /** Called once a pawn has landed, which ends its move. */
  onPawnArrived?: (pawnId: number) => void;
};

/** Every pawn on the board. Drop it inside a `Board` as its child. */
export function PawnLayer({
  pawns,
  selectablePawnIds = [],
  moveDistance = 0,
  boardSize = BOARD_SIZE,
  onPawnClick = () => {},
  onPawnArrived = () => {},
}: PawnLayerProps) {
  const [hoveredPawnId, setHoveredPawnId] = useState(NO_PAWN);

  //looked up among the selectable pawns only, so the trail vanishes on its own
  //once the card has been used.
  const hoveredPawn = pawns.find(
    (pawn) => pawn.id === hoveredPawnId && selectablePawnIds.includes(pawn.id),
  );

  function handleHoverChange(pawnId: number, isHovered: boolean) {
    if (isHovered) {
      setHoveredPawnId(pawnId);
      return;
    }

    //ignore the pawn we already left, in case another one was entered first.
    if (hoveredPawnId === pawnId) setHoveredPawnId(NO_PAWN);
  }

  return (
    <g>
      <AnimatePresence>
        {hoveredPawn && moveDistance > 0 && (
          <MovePreview
            key={hoveredPawn.id}
            color={TEAM_COLORS[hoveredPawn.team]}
            stops={getPreviewStops(hoveredPawn, moveDistance, boardSize)}
          />
        )}
      </AnimatePresence>

      {pawns.map((pawn) => (
        <Pawn
          key={pawn.id}
          color={TEAM_COLORS[pawn.team]}
          position={getPawnPosition(pawn, boardSize)}
          path={pawn.travelPath.map((cellIndex) =>
            computeCoordsFromIndex({ index: cellIndex, boardSize }),
          )}
          isSelectable={selectablePawnIds.includes(pawn.id)}
          onClick={() => onPawnClick(pawn.id)}
          onArrived={() => onPawnArrived(pawn.id)}
          onHoverChange={(isHovered) => handleHoverChange(pawn.id, isHovered)}
        />
      ))}
    </g>
  );
}
