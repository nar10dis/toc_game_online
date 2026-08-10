import { useCallback, useState } from "react";

import {
  PAWNS_PER_TEAM,
  TEAMS_NUMBER,
  getStartCellIndex,
  getTravelPath,
} from "@/game/boardGeometry";

/* ************************************************************************** */
/*                                 TYPES DEF                                  */
/* ************************************************************************** */

export type Pawn = {
  id: number;
  /** 0 top, 1 right, 2 bottom, 3 left — the colour of the pawn. */
  team: number;
  /** Where the pawn stands: waiting in its spawn zone, or out on the track. */
  zone: "spawn" | "board";
  /** Cell of the spawn zone it waits on, from 0 to `PAWNS_PER_TEAM - 1`. */
  spawnSlot: number;
  /** Cell of the track it stands on. Only read while `zone` is "board". */
  cellIndex: number;
  /** Cells it is walking through right now. Empty while it stands still. */
  travelPath: number[];
};

export type PawnsState = {
  pawns: Pawn[];
  /** Cells the played card still has to move, or 0 when no card is waiting. */
  pendingMoveDistance: number;
  /** Pawns the player may click right now. They shine on the board. */
  selectablePawnIds: number[];
  playCardOnPawns: (moveDistance: number) => void;
  choosePawn: (pawnId: number) => void;
  finishPawnMove: (pawnId: number) => void;
  resetPawns: () => void;
};

/* ************************************************************************** */
/*                                 CONST DEF                                  */
/* ************************************************************************** */

/** Only the ace and the king bring a pawn out of the spawn zone. */
const SPAWNING_DISTANCES = [1, 13];

/* ************************************************************************** */
/*                                 GAME RULES                                 */
/* ************************************************************************** */

function createStartingPawns(): Pawn[] {
  const pawns: Pawn[] = [];

  for (let team = 0; team < TEAMS_NUMBER; team++) {
    for (let slot = 0; slot < PAWNS_PER_TEAM; slot++) {
      pawns.push({
        id: team * PAWNS_PER_TEAM + slot,
        team,
        zone: "spawn",
        spawnSlot: slot,
        cellIndex: getStartCellIndex(team),
        travelPath: [],
      });
    }
  }

  return pawns;
}

function isCellTaken(pawns: Pawn[], cellIndex: number): boolean {
  return pawns.some(
    (pawn) => pawn.zone === "board" && pawn.cellIndex === cellIndex,
  );
}

function canPawnUseCard(
  pawn: Pawn,
  pawns: Pawn[],
  moveDistance: number,
): boolean {
  if (pawn.zone === "board") return true;

  if (!SPAWNING_DISTANCES.includes(moveDistance)) return false;

  //a pawn cannot come out onto a start cell one of its own is already sitting on.
  return !isCellTaken(pawns, getStartCellIndex(pawn.team));
}

function getSelectablePawnIds(pawns: Pawn[], moveDistance: number): number[] {
  if (moveDistance === 0) return [];

  return pawns
    .filter((pawn) => canPawnUseCard(pawn, pawns, moveDistance))
    .map((pawn) => pawn.id);
}

/**
 * Cells the pawn would walk over if the card were played on it, the arrival
 * last. A waiting pawn only ever hops to its start cell.
 */
export function getPawnTravelPath(pawn: Pawn, moveDistance: number): number[] {
  if (pawn.zone === "spawn") return [getStartCellIndex(pawn.team)];

  return getTravelPath(pawn.cellIndex, moveDistance);
}

/** The same pawn, walking to where the card sends it. */
function movePawn(pawn: Pawn, moveDistance: number): Pawn {
  const travelPath = getPawnTravelPath(pawn, moveDistance);

  return {
    ...pawn,
    zone: "board",
    cellIndex: travelPath[travelPath.length - 1],
    travelPath,
  };
}

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

/**
 * Holds the sixteen pawns and walks them around the board, but draws nothing
 * on screen — see `PawnLayer`.
 *
 * A turn is two calls: `playCardOnPawns` with the value of the card, then
 * `choosePawn` with the pawn the player clicked among `selectablePawnIds`.
 */
export function usePawns(): PawnsState {
  const [pawns, setPawns] = useState<Pawn[]>(createStartingPawns);
  const [pendingMoveDistance, setPendingMoveDistance] = useState(0);

  const playCardOnPawns = useCallback(
    (moveDistance: number) => {
      //no pawn can use the card, so it is simply spent: never wait for a click
      //the player cannot make.
      if (getSelectablePawnIds(pawns, moveDistance).length === 0) return;

      setPendingMoveDistance(moveDistance);
    },
    [pawns],
  );

  const choosePawn = useCallback(
    (pawnId: number) => {
      if (pendingMoveDistance === 0) return;

      setPawns((currentPawns) => {
        const chosenPawn = currentPawns.find((pawn) => pawn.id === pawnId);
        if (!chosenPawn) return currentPawns;
        if (!canPawnUseCard(chosenPawn, currentPawns, pendingMoveDistance)) {
          return currentPawns;
        }

        return currentPawns.map((pawn) => {
          if (pawn.id !== pawnId) return pawn;
          return movePawn(pawn, pendingMoveDistance);
        });
      });

      setPendingMoveDistance(0);
    },
    [pendingMoveDistance],
  );

  const finishPawnMove = useCallback((pawnId: number) => {
    setPawns((currentPawns) => {
      const arrivedPawn = currentPawns.find((pawn) => pawn.id === pawnId);
      //every pawn reports the end of its little settling animation too, and
      //those must not touch the state.
      if (!arrivedPawn) return currentPawns;
      if (arrivedPawn.travelPath.length === 0) return currentPawns;

      return currentPawns.map((pawn) => {
        if (pawn.id !== pawnId) return pawn;
        return { ...pawn, travelPath: [] };
      });
    });
  }, []);

  const resetPawns = useCallback(() => {
    setPawns(createStartingPawns());
    setPendingMoveDistance(0);
  }, []);

  return {
    pawns,
    pendingMoveDistance,
    selectablePawnIds: getSelectablePawnIds(pawns, pendingMoveDistance),
    playCardOnPawns,
    choosePawn,
    finishPawnMove,
    resetPawns,
  };
}
