import { useState } from "react";
import { AnimatePresence } from "motion/react";

import {
  BOARD_SIZE,
  HOME_CELLS,
  TEAM_COLORS,
  computeCoordsFromIndex,
  computeHomeCoords,
  computeSpawnCoords,
  getSpawnCellIndex,
  type Point,
} from "@/game/boardGeometry";
import { MovePreview } from "@/game/MovePreview";
import { Pawn } from "@/game/Pawn";
import { getPreviewPath, type BoardPawn as PawnData } from "@/game/boardPawns";
import { getCardValueFromId } from "@/game/cardDeck";
import type { LegalMove, PawnPosition } from "@/game/gameTypes";

/** No pawn is hovered right now. */
const NO_PAWN = -1;

/* ************************************************************************** */
/*                                 GEOMETRY                                   */
/* ************************************************************************** */

/** Where the pawn stands: its cell of the spawn zone, of its home, or of the track. */
function getPawnPosition(pawn: PawnData, boardSize: number): Point {
  if (pawn.zone === "spawn") {
    return computeSpawnCoords(
      getSpawnCellIndex(pawn.team, pawn.spawnSlot),
      boardSize,
    );
  }
  if (pawn.zone === "home") {
    return computeHomeCoords(pawn.team * HOME_CELLS + pawn.cellIndex, boardSize);
  }

  return computeCoordsFromIndex({ index: pawn.cellIndex, boardSize });
}

/** Centre of a cell of the track or of the pawn's home. */
function getCellCoords(pawn: PawnData, position: PawnPosition, boardSize: number): Point {
  if (position.zone === "home") {
    return computeHomeCoords(pawn.team * HOME_CELLS + position.cell, boardSize);
  }
  if (position.zone === "board") {
    return computeCoordsFromIndex({ index: position.cell, boardSize });
  }
  return getPawnPosition(pawn, boardSize);
}

/** Where the pawn stands, then every cell the move walks it over. */
function getPreviewStops(pawn: PawnData, move: LegalMove, boardSize: number): Point[] {
  if (!move.to) return [];

  const isBackward = getCardValueFromId(move.action.cardId) === 4;
  const path = getPreviewPath(pawn, move.to, isBackward);
  const stops = path.map((position) => getCellCoords(pawn, position, boardSize));

  return [getPawnPosition(pawn, boardSize), ...stops];
}

/** The moves of the selected card that play this pawn. */
function getMovesOfPawn(moves: LegalMove[], pawnId: number): LegalMove[] {
  return moves.filter((move) => {
    const action = move.action;
    return action.type !== "swap" && action.type !== "discard" && action.pawnId === pawnId;
  });
}

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

type PawnLayerProps = {
  pawns: PawnData[];
  /** Pawns the player may click. They shine. */
  selectablePawnIds?: number[];
  /** Moves of the selected card: each draws its trail when its pawn is hovered. */
  previewMoves?: LegalMove[];
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
  previewMoves = [],
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
        {/* one trail per place it can go: along the track, and into its home */}
        {hoveredPawn &&
          getMovesOfPawn(previewMoves, hoveredPawn.id).map((move, index) => (
            <MovePreview
              key={`${hoveredPawn.id}-${index}`}
              color={TEAM_COLORS[hoveredPawn.team]}
              stops={getPreviewStops(hoveredPawn, move, boardSize)}
            />
          ))}
      </AnimatePresence>

      {pawns.map((pawn) => (
        <Pawn
          key={pawn.id}
          color={TEAM_COLORS[pawn.team]}
          position={getPawnPosition(pawn, boardSize)}
          path={pawn.travelPath.map((cellIndex) =>
            computeCoordsFromIndex({ index: cellIndex, boardSize }),
          )}
          death={
            pawn.death && {
              from: computeCoordsFromIndex({ index: pawn.death.cellIndex, boardSize }),
              afterSteps: pawn.death.afterSteps,
            }
          }
          isSelectable={selectablePawnIds.includes(pawn.id)}
          onClick={() => onPawnClick(pawn.id)}
          onArrived={() => onPawnArrived(pawn.id)}
          onHoverChange={(isHovered) => handleHoverChange(pawn.id, isHovered)}
        />
      ))}
    </g>
  );
}
