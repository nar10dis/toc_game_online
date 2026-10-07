import { AnimatePresence, motion } from "motion/react";

import { PAWNS_PER_TEAM, TEAM_COLORS } from "@/lib/game/boardGeometry";
import { getCardValueFromId } from "@/lib/game/cardDeck";
import type { CardId, GameEvent } from "@/lib/game/gameTypes";

/* ************************************************************************** */
/*                                 CONST DEF                                  */
/* ************************************************************************** */

/** Lines kept in the log: older ones are dropped. */
const MAX_ENTRIES = 20;

const SHORT_VALUE: Record<number, string> = { 1: "A", 11: "V", 12: "D", 13: "R" };
const SUIT_SYMBOL: Record<string, string> = { heart: "♥", diamond: "♦", club: "♣", spade: "♠" };

/* ************************************************************************** */
/*                                 LOG ENTRIES                                */
/* ************************************************************************** */

/** One line of the log: one card played. The pieces of a 7 share one line. */
type LogEntry = {
  key: number;
  seat: number;
  cardId: CardId;
  /** What the card did, written out. */
  text: string;
  /** Pieces of the 7, in order. Empty for any other card. */
  splitSteps: { steps: number; enter: boolean }[];
  /** Seats of the pawns sent back to their spawn. */
  capturedSeats: number[];
  newRound: boolean;
};

/** The server numbers pawns seat * 4 + i. */
function seatOfPawn(pawnId: number): number {
  return Math.floor(pawnId / PAWNS_PER_TEAM);
}

function describeAction(event: GameEvent, playerNames: string[]): string {
  const action = event.action;

  if (action.type === "move") {
    const value = getCardValueFromId(action.cardId);
    return value === 4 ? "recule de 4" : `avance de ${value}`;
  }
  if (action.type === "enter") return "rentre à la maison";
  if (action.type === "exit") return "sort un pion";
  if (action.type === "discard") return "défausse";
  if (action.type === "swap") {
    const seatA = seatOfPawn(action.pawnIdA);
    const seatB = seatOfPawn(action.pawnIdB);
    const otherSeat = seatA === event.seat ? seatB : seatA;
    if (otherSeat === event.seat) return "échange deux de ses pions";
    return `échange avec ${playerNames[otherSeat]}`;
  }
  return "";
}

/** The events turned into lines, newest first. */
function buildEntries(events: GameEvent[], playerNames: string[]): LogEntry[] {
  const entries: LogEntry[] = [];

  events.forEach((event, index) => {
    const action = event.action;
    const capturedSeats = event.captured.map((pawn) => pawn.playerSeat);
    const previous = entries[entries.length - 1];

    // the next piece of the same 7 goes on the line of the first one
    const isSameSeven =
      action.type === "split" &&
      previous !== undefined &&
      previous.cardId === action.cardId &&
      previous.seat === event.seat;

    if (action.type === "split" && isSameSeven) {
      previous.splitSteps.push({ steps: action.steps, enter: action.enter });
      previous.capturedSeats.push(...capturedSeats);
      previous.newRound = event.newRound;
      return;
    }

    entries.push({
      key: index,
      seat: event.seat,
      cardId: action.cardId,
      text: describeAction(event, playerNames),
      splitSteps: action.type === "split" ? [{ steps: action.steps, enter: action.enter }] : [],
      capturedSeats,
      newRound: event.newRound,
    });
  });

  return entries.slice(-MAX_ENTRIES).reverse();
}

/** "3 + 4", and "rentre" when one of the pieces went home. */
function describeSeven(splitSteps: LogEntry["splitSteps"]): string {
  const steps = splitSteps.map((piece) => piece.steps).join(" + ");
  const wentHome = splitSteps.some((piece) => piece.enter);
  return wentHome ? `avance de ${steps}, rentre` : `avance de ${steps}`;
}

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

/** The card, tiny: its value and its suit. */
function MiniCard({ cardId }: { cardId: CardId }) {
  const [color, valueText] = cardId.split("_");
  const value = Number(valueText);
  const isRed = color === "heart" || color === "diamond";

  return (
    <span
      className="inline-flex h-6 min-w-7 shrink-0 items-center justify-center rounded border border-foreground/40 bg-background px-1 text-xs font-bold"
      style={{ color: isRed ? "#C0392B" : "var(--foreground)" }}
    >
      {SHORT_VALUE[value] ?? value}
      {SUIT_SYMBOL[color]}
    </span>
  );
}

type GameLogProps = {
  events: GameEvent[];
  /** Indexed by seat. */
  playerNames: string[];
};

/** Who played what, newest first. Folds away on a click on its title. */
export function GameLog({ events, playerNames }: GameLogProps) {
  const entries = buildEntries(events, playerNames);

  return (
    <details open className="mt-6 w-full">
      <summary className="cursor-pointer font-heading text-lg font-bold">Journal</summary>

      {entries.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">Aucun coup pour l&apos;instant.</p>
      )}

      <ul className="mt-2 flex h-[22vh] flex-col gap-2 overflow-y-auto pr-1 text-sm">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.li
              key={entry.key}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* newest on top: the round began after this line, so above it */}
              {entry.newRound && (
                <p className="mb-2 text-center text-xs text-muted-foreground">— Nouvelle manche —</p>
              )}

              <div className="flex items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: TEAM_COLORS[entry.seat] }}
                />
                <span className="font-bold" style={{ color: TEAM_COLORS[entry.seat] }}>
                  {playerNames[entry.seat]}
                </span>
                <MiniCard cardId={entry.cardId} />
                <span>{entry.splitSteps.length > 0 ? describeSeven(entry.splitSteps) : entry.text}</span>
              </div>

              {entry.capturedSeats.length > 0 && (
                <p className="mt-0.5 pl-5 text-destructive">
                  ✖ capture {entry.capturedSeats.map((seat) => playerNames[seat]).join(", ")}
                </p>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </details>
  );
}
