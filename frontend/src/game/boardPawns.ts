/**
 * Turns the pawns sent by the server into what `PawnLayer` draws.
 * Pure functions: no React.
 */

import {
  PAWNS_PER_TEAM,
  TOTAL_CELLS,
  getStartCellIndex,
  getTravelPath,
} from "@/game/boardGeometry";
import { getCardValueFromId } from "@/game/cardDeck";
import type { GameEvent, Pawn } from "@/game/gameTypes";

/* ************************************************************************** */
/*                                 TYPES DEF                                  */
/* ************************************************************************** */

export type BoardPawn = {
  id: number;
  /** The seat that owns it, which is also its colour. */
  team: number;
  zone: "spawn" | "board" | "home";
  /** Cell of the spawn zone it waits on, from 0 to `PAWNS_PER_TEAM - 1`. */
  spawnSlot: number;
  /** Cell of the track (zone "board") or of the home, 0 = the door (zone "home"). */
  cellIndex: number;
  /** Cells it is walking through right now. Empty while it stands still. */
  travelPath: number[];
};

/* ************************************************************************** */
/*                                 CONVERSION                                 */
/* ************************************************************************** */

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/**
 * Cells the pawn hopped over during the last event, so it walks instead of
 * jumping. Only for a move on the track and a pawn coming out: everything
 * else (home, swap, capture) simply slides to its new place.
 */
function getLastTravelPath(pawn: Pawn, lastEvent: GameEvent | null): number[] {
  if (!lastEvent) return [];
  if (pawn.position.zone !== "board") return [];

  const action = lastEvent.action;
  if (action.type === "exit" && action.pawnId === pawn.id) {
    return [pawn.position.cell];
  }
  if (action.type === "move" && action.pawnId === pawn.id) {
    const steps = getCardValueFromId(action.cardId);
    // walk back from where it landed to find where it started
    const startCell = mod(pawn.position.cell - steps, TOTAL_CELLS);
    return getTravelPath(startCell, steps);
  }
  return [];
}

export function toBoardPawns(pawns: Pawn[], lastEvent: GameEvent | null): BoardPawn[] {
  return pawns.map((pawn) => {
    let cellIndex = 0;
    if (pawn.position.zone !== "spawn") {
      cellIndex = pawn.position.cell;
    }

    return {
      id: pawn.id,
      team: pawn.playerSeat,
      zone: pawn.position.zone,
      // the server numbers pawns seat * 4 + i, so i is a free spawn slot
      spawnSlot: pawn.id % PAWNS_PER_TEAM,
      cellIndex,
      travelPath: getLastTravelPath(pawn, lastEvent),
    };
  });
}

/**
 * Cells the pawn would walk over if the card were played on it, the arrival
 * last. Used for the dotted preview on hover.
 */
export function getPawnTravelPath(pawn: BoardPawn, moveDistance: number): number[] {
  if (pawn.zone === "spawn") return [getStartCellIndex(pawn.team)];
  if (pawn.zone === "home") return [];

  return getTravelPath(pawn.cellIndex, moveDistance);
}
