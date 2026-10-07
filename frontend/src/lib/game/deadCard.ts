/**
 * Why a card of my hand can do nothing this turn. The server already decided
 * it (its only legal move is a discard): this only puts it into words.
 */

import type { Card, GameView } from "@/lib/game/gameTypes";

/** Said after every reason: clicking such a card throws it away. */
const DISCARD_WARNING = "Si tu cliques dessus, elle sera défaussée.";

/** The only two rules that stop a pawn, said once for every card that moves one. */
const BLOCKED_PATH =
  "Un pion arrêté sur sa case de départ bloque le passage, et ta maison n'a peut-être plus assez de place.";

function reasonFor(card: Card, game: GameView): string {
  const myPawns = game.pawns.filter((pawn) => pawn.playerSeat === game.mySeat);
  const otherPawns = game.pawns.filter((pawn) => pawn.playerSeat !== game.mySeat);
  const hasPawnOut = myPawns.some((pawn) => pawn.position.zone !== "spawn");

  if (card.value === 11) {
    const hasMineOnBoard = myPawns.some((pawn) => pawn.position.zone === "board");
    if (!hasMineOnBoard) {
      return "Le valet échange un de tes pions avec un autre, mais aucun de tes pions n'est sur le plateau.";
    }
    return "Le valet échange un de tes pions avec un autre, mais il n'y a aucun autre pion sur le plateau.";
  }

  if (card.value === 5) {
    const hasOtherOnBoard = otherPawns.some((pawn) => pawn.position.zone === "board");
    if (!hasOtherOnBoard) {
      return "Le 5 fait avancer un pion adverse, mais aucun pion adverse n'est sur le plateau.";
    }
    return `Le 5 fait avancer un pion adverse de 5 cases, mais aucun ne peut. ${BLOCKED_PATH}`;
  }

  if (!hasPawnOut) {
    return "Tous tes pions sont encore dans leur zone de départ : il faut un As ou un Roi pour en sortir un.";
  }

  if (card.value === 7) {
    return `Tes pions ne peuvent pas se partager les 7 cases. ${BLOCKED_PATH}`;
  }

  let move = `avancer de ${card.value} cases`;
  if (card.value === 4) move = "reculer de 4 cases";
  if (card.value === 1) move = "avancer d'1 case";

  //the ace and the king also bring a pawn out: none is left to bring out.
  if (card.value === 1 || card.value === 13) {
    return `Tu n'as plus de pion à sortir, et aucun de tes pions ne peut ${move}. ${BLOCKED_PATH}`;
  }
  return `Aucun de tes pions ne peut ${move}. ${BLOCKED_PATH}`;
}

/**
 * Why `card` cannot be played, or `null` when it can. Only known on my turn:
 * the server sends no legal moves the rest of the time.
 */
export function deadCardReason(card: Card, game: GameView): string | null {
  const moves = game.legalMoves.filter((move) => move.action.cardId === card.id);
  const isDead = moves.length > 0 && moves.every((move) => move.action.type === "discard");
  if (!isDead) return null;
  return `${reasonFor(card, game)} ${DISCARD_WARNING}`;
}
