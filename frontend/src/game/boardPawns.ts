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
import type { GameEvent, Pawn, PawnPosition } from "@/game/gameTypes";

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
  /** Set when it was just captured: where it died, and after how many hops of the killer. */
  death: { cellIndex: number; afterSteps: number } | null;
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
    let steps = getCardValueFromId(action.cardId);
    // the 4 goes backward, like on the server (realValueOf)
    if (steps === 4) steps = -4;
    // walk back from where it landed to find where it started
    const startCell = mod(pawn.position.cell - steps, TOTAL_CELLS);
    return getTravelPath(startCell, steps);
  }
  // a piece of the 7: same walk, with its own number of steps
  if (action.type === "split" && !action.enter && action.pawnId === pawn.id) {
    const startCell = mod(pawn.position.cell - action.steps, TOTAL_CELLS);
    return getTravelPath(startCell, action.steps);
  }
  return [];
}

/**
 * A pawn captured by the last event waits on its cell until the killer lands
 * there (or walks over it, for the 7), then dies.
 */
function getDeath(pawn: Pawn, lastEvent: GameEvent | null, killerPath: number[]): BoardPawn["death"] {
  const victim = lastEvent?.captured.find((captured) => captured.id === pawn.id);
  if (!victim || victim.position.zone !== "board") return null;

  const cellIndex = victim.position.cell;
  // the hop that reaches its cell; 0 when the killer does not walk (it dies at once)
  const afterSteps = killerPath.indexOf(cellIndex) + 1;

  return { cellIndex, afterSteps };
}

export function toBoardPawns(pawns: Pawn[], lastEvent: GameEvent | null): BoardPawn[] {
  // the pawn that just moved: its walk sets when its victims die
  let killerPath: number[] = [];
  for (const pawn of pawns) {
    const path = getLastTravelPath(pawn, lastEvent);
    if (path.length > 0) killerPath = path;
  }

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
      death: getDeath(pawn, lastEvent, killerPath),
    };
  });
}

/** A seat's home opens onto the track this many cells before its start cell. */
const HOME_DOOR_OFFSET = 3;

/**
 * Cells the pawn walks over to reach `to`, the arrival last. Used for the
 * dotted preview on hover. `isBackward` is for the 4.
 */
export function getPreviewPath(
  pawn: BoardPawn,
  to: PawnPosition,
  isBackward: boolean,
): PawnPosition[] {
  if (to.zone === "spawn") return [];
  if (pawn.zone === "spawn") return [to];

  const path: PawnPosition[] = [];

  if (pawn.zone === "home") {
    for (let cell = pawn.cellIndex + 1; cell <= to.cell; cell++) {
      path.push({ zone: "home", cell });
    }
    return path;
  }

  // along the track, up to the arrival, or up to the door of the home
  const door = mod(getStartCellIndex(pawn.team) - HOME_DOOR_OFFSET, TOTAL_CELLS);
  const lastTrackCell = to.zone === "board" ? to.cell : door;
  const direction = isBackward ? -1 : 1;

  let cell = pawn.cellIndex;
  while (cell !== lastTrackCell) {
    cell = mod(cell + direction, TOTAL_CELLS);
    path.push({ zone: "board", cell });
  }

  // then through the door, into the home
  if (to.zone === "home") {
    for (let homeCell = 0; homeCell <= to.cell; homeCell++) {
      path.push({ zone: "home", cell: homeCell });
    }
  }
  return path;
}
