import { useState } from "react";

import { getCardValueFromId } from "@/game/cardDeck";
import type { ActionAnswer, CardId, GameAction, GameView } from "@/game/gameTypes";

/** What a click on a pawn will do with the selected card. */
export type PlayMode = "move" | "enter" | "swap";

export type TurnChoice = {
  selectedCardId: CardId | null;
  /** Value of the selected card, 0 when none is selected. */
  selectedCardValue: number;
  playMode: PlayMode;
  /** First pawn picked for a swap, null until then. */
  firstSwapPawnId: number | null;
  selectablePawnIds: number[];
  errorMessage: string | null;
  handleCardClick: (cardId: CardId) => void;
  handlePawnClick: (pawnId: number) => void;
  handleDiscard: () => void;
  changePlayMode: (playMode: PlayMode) => void;
};

/**
 * The player builds an action in two or three clicks: a card, maybe a mode,
 * then a pawn. The server checks if the move is legal, not us: we only
 * send it and show its answer.
 */
export function useTurnChoice(
  game: GameView | null,
  sendAction: (action: GameAction) => Promise<ActionAnswer>,
): TurnChoice {
  const [selectedCardId, setSelectedCardId] = useState<CardId | null>(null);
  const [playMode, setPlayMode] = useState<PlayMode>("move");
  const [firstSwapPawnId, setFirstSwapPawnId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  let selectedCardValue = 0;
  if (selectedCardId) {
    selectedCardValue = getCardValueFromId(selectedCardId);
  }

  function resetChoice() {
    setSelectedCardId(null);
    setPlayMode("move");
    setFirstSwapPawnId(null);
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

  function handleCardClick(cardId: CardId) {
    if (cardId === selectedCardId) {
      resetChoice();
      return;
    }
    resetChoice();
    setSelectedCardId(cardId);
  }

  function changePlayMode(newPlayMode: PlayMode) {
    setPlayMode(newPlayMode);
    setFirstSwapPawnId(null);
  }

  function handleDiscard() {
    if (!selectedCardId) return;
    send({ type: "discard", cardId: selectedCardId });
  }

  function handlePawnClick(pawnId: number) {
    if (!game || !selectedCardId) return;
    const pawn = game.pawns.find((onePawn) => onePawn.id === pawnId);
    if (!pawn) return;

    if (playMode === "swap") {
      if (firstSwapPawnId === null) {
        setFirstSwapPawnId(pawnId);
        return;
      }
      let pawnIdA = firstSwapPawnId;
      let pawnIdB = pawnId;
      const otherPawn = game.pawns.find((onePawn) => onePawn.id === firstSwapPawnId);
      // the server lists a swap between two of my pawns only once, smallest id first
      if (otherPawn && otherPawn.playerSeat === pawn.playerSeat && pawnIdA > pawnIdB) {
        pawnIdA = pawnId;
        pawnIdB = firstSwapPawnId;
      }
      send({ type: "swap", cardId: selectedCardId, pawnIdA, pawnIdB });
      return;
    }

    if (playMode === "enter") {
      send({ type: "enter", cardId: selectedCardId, pawnId });
      return;
    }

    // a pawn waiting in its spawn can only come out
    if (pawn.position.zone === "spawn") {
      send({ type: "exit", cardId: selectedCardId, pawnId });
      return;
    }
    send({ type: "move", cardId: selectedCardId, pawnId });
  }

  const selectablePawnIds = getSelectablePawnIds(game, selectedCardValue, playMode, firstSwapPawnId);

  return {
    selectedCardId,
    selectedCardValue,
    playMode,
    firstSwapPawnId,
    selectablePawnIds,
    errorMessage,
    handleCardClick,
    handlePawnClick,
    handleDiscard,
    changePlayMode,
  };
}

/** Pawns worth a click: only a hint, the server has the last word. */
function getSelectablePawnIds(
  game: GameView | null,
  selectedCardValue: number,
  playMode: PlayMode,
  firstSwapPawnId: number | null,
): number[] {
  if (!game || selectedCardValue === 0) return [];

  const selectable: number[] = [];
  for (const pawn of game.pawns) {
    const isMine = pawn.playerSeat === game.mySeat;
    const isOnBoard = pawn.position.zone === "board";

    if (playMode === "swap") {
      // first one of mine, then anyone else on the track
      if (firstSwapPawnId === null && isMine && isOnBoard) selectable.push(pawn.id);
      if (firstSwapPawnId !== null && isOnBoard && pawn.id !== firstSwapPawnId) selectable.push(pawn.id);
      continue;
    }
    if (!isMine) continue;
    if (playMode === "enter" && !isOnBoard) continue;
    // only the ace and the king bring a pawn out of the spawn
    if (pawn.position.zone === "spawn" && selectedCardValue !== 1 && selectedCardValue !== 13) continue;
    selectable.push(pawn.id);
  }
  return selectable;
}
