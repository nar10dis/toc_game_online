import { useState } from "react";

import { getCardValueFromId } from "@/game/cardDeck";
import type {
  ActionAnswer,
  CardId,
  GameAction,
  GameView,
  LegalMove,
} from "@/game/gameTypes";

export type TurnChoice = {
  selectedCardId: CardId | null;
  /** Value of the selected card, 0 when none is selected. */
  selectedCardValue: number;
  /** Pawn picked first: the one to move, or the first of a swap. */
  selectedPawnId: number | null;
  /** True when a 7 is being played: another card cannot be picked. */
  isSplitInProgress: boolean;
  /** Steps of the 7 still to play. */
  splitLeft: number;
  selectablePawnIds: number[];
  /** Every legal move of the selected card, for the trails on hover. */
  cardMoves: LegalMove[];
  /** Where the selected pawn can go, when there is more than one choice. */
  destinations: LegalMove[];
  errorMessage: string | null;
  handleCardClick: (cardId: CardId) => void;
  handlePawnClick: (pawnId: number) => void;
  handleDestinationClick: (move: LegalMove) => void;
};

/** The pawns an action moves: two for a swap, none for a discard. */
function pawnIdsOf(action: GameAction): number[] {
  if (action.type === "swap") return [action.pawnIdA, action.pawnIdB];
  if (action.type === "discard") return [];
  return [action.pawnId];
}

/**
 * The player picks a card, then a pawn, then (only if there are several) the
 * cell to go to. Every choice comes from `game.legalMoves`, sent by the
 * server: the front never has to know the rules.
 */
export function useTurnChoice(
  game: GameView | null,
  sendAction: (action: GameAction) => Promise<ActionAnswer>,
): TurnChoice {
  const [selectedCardId, setSelectedCardId] = useState<CardId | null>(null);
  const [selectedPawnId, setSelectedPawnId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // the 7 is played in several pieces: while one is going on, its card is
  // already on the discard pile and no other card can be picked
  const pendingSplit = game?.pendingSplit ?? null;
  const isSplitInProgress = pendingSplit !== null;
  const cardId = pendingSplit?.cardId ?? selectedCardId;

  let selectedCardValue = 0;
  if (cardId) {
    selectedCardValue = getCardValueFromId(cardId);
  }
  const isJack = selectedCardValue === 11;

  const legalMoves = game?.legalMoves ?? [];
  const cardMoves = legalMoves.filter((move) => move.action.cardId === cardId);

  function resetChoice() {
    setSelectedCardId(null);
    setSelectedPawnId(null);
  }

  async function send(action: GameAction) {
    resetChoice();
    const answer = await sendAction(action);
    if ("error" in answer) {
      setErrorMessage(answer.error);
      return;
    }
    setErrorMessage(null);
  }

  function handleCardClick(clickedCardId: CardId) {
    if (clickedCardId === selectedCardId) {
      resetChoice();
      return;
    }

    // a card that can do nothing else is discarded right away
    const moves = legalMoves.filter((move) => move.action.cardId === clickedCardId);
    if (moves.length === 1 && moves[0].action.type === "discard") {
      send(moves[0].action);
      return;
    }

    resetChoice();
    setSelectedCardId(clickedCardId);
  }

  function handlePawnClick(pawnId: number) {
    // the jack: first pawn, then the one to swap it with
    if (isJack && selectedPawnId !== null && selectedPawnId !== pawnId) {
      const swap = cardMoves.find((move) => {
        const pawnIds = pawnIdsOf(move.action);
        return pawnIds.includes(selectedPawnId) && pawnIds.includes(pawnId);
      });
      if (swap) {
        send(swap.action);
        return;
      }
    }

    // only one place to go: no need to ask where
    const pawnMoves = cardMoves.filter((move) => pawnIdsOf(move.action)[0] === pawnId);
    if (!isJack && pawnMoves.length === 1) {
      send(pawnMoves[0].action);
      return;
    }

    // a second click on the same pawn lets it go
    setSelectedPawnId(pawnId === selectedPawnId ? null : pawnId);
  }

  function handleDestinationClick(move: LegalMove) {
    send(move.action);
  }

  // before picking a pawn: my pawns that can do something with the card.
  // For the jack, once the first one is picked: the pawns it can swap with.
  const selectablePawnIds: number[] = [];
  for (const move of cardMoves) {
    const pawnIds = pawnIdsOf(move.action);

    if (isJack && selectedPawnId !== null) {
      if (pawnIds.includes(selectedPawnId)) {
        selectablePawnIds.push(...pawnIds.filter((pawnId) => pawnId !== selectedPawnId));
      }
      continue;
    }
    for (const pawnId of pawnIds) {
      const pawn = game?.pawns.find((onePawn) => onePawn.id === pawnId);
      if (pawn && pawn.playerSeat === game?.mySeat) selectablePawnIds.push(pawnId);
    }
  }
  // the picked pawn stays clickable, to let it go
  if (selectedPawnId !== null) selectablePawnIds.push(selectedPawnId);

  let destinations: LegalMove[] = [];
  if (!isJack && selectedPawnId !== null) {
    destinations = cardMoves.filter(
      (move) => move.to !== null && pawnIdsOf(move.action)[0] === selectedPawnId,
    );
  }

  return {
    selectedCardId,
    selectedCardValue,
    selectedPawnId,
    isSplitInProgress,
    splitLeft: pendingSplit?.left ?? 7,
    selectablePawnIds,
    cardMoves,
    destinations,
    errorMessage,
    handleCardClick,
    handlePawnClick,
    handleDestinationClick,
  };
}
