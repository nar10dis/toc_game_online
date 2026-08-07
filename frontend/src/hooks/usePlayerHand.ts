import { useCallback, useEffect, useRef, useState } from "react";

import {
  drawCardFromDeck,
  getCardId,
  replaceDeckWithFreshOne,
  type Card,
} from "@/game/cardDeck";
import {
  MAX_CARDS_IN_HAND,
  pickRandomPlayedCardTilt,
} from "@/game/cardTableLayout";

/** A card currently on screen, either held in hand or played in the middle. */
export type CardOnTable = {
  card: Card;
  /**
   * React key for as long as the card is on screen. It is deliberately kept
   * when the card moves from the hand to the pile, so React reuses the same
   * element and the card glides across from wherever it sits, instead of being
   * unmounted and remounted at its new place.
   */
  tableId: string;
};

/** A card that has been played and now rests on the pile in the middle. */
export type PlayedCard = CardOnTable & {
  /** Its lean on the pile, drawn once when it was played. */
  tiltInDegrees: number;
};

export type PlayerHandState = {
  /** Cards currently held, left to right. */
  cardsInHand: CardOnTable[];
  /** The pile in the middle, oldest first. The last one is on top. */
  playedCards: PlayedCard[];
  /** True while a played card is still travelling to the pile. */
  isPlayingCard: boolean;
  /** True when the hand could not be refilled because the deck ran out. */
  isDeckEmpty: boolean;
  /** Sends the card on its way to the pile. Draws nothing yet. */
  playCard: (tableId: string) => void;
  /** Called when the played card lands: this is what releases the draw. */
  finishPlayingCard: (tableId: string) => void;
  /** Shuffles a brand new deck, clears the table and deals a fresh hand. */
  startNewDeckAndDealAgain: () => void;
};

type RefilledHand = {
  hand: CardOnTable[];
  /** True if the deck ran out before the hand could be filled. */
  deckRanOut: boolean;
};

/**
 * Draws until the hand holds `MAX_CARDS_IN_HAND` cards, or until the deck is
 * exhausted. Kept outside the hook because it mutates the deck: it must be
 * called once per event, never from inside a state updater, which React is
 * free to run twice.
 */
function drawUpToFullHand(
  currentHand: CardOnTable[],
  putCardOnTable: (card: Card) => CardOnTable,
): RefilledHand {
  const hand = [...currentHand];

  while (hand.length < MAX_CARDS_IN_HAND) {
    const drawnCard = drawCardFromDeck();
    if (!drawnCard) return { hand, deckRanOut: true };
    hand.push(putCardOnTable(drawnCard));
  }

  return { hand, deckRanOut: false };
}

/**
 * Owns everything on the table.
 *
 * Playing a card happens in two steps so the animations do not overlap:
 * `playCard` starts the card on its way to the pile, and `finishPlayingCard`
 * — called when it lands — draws the replacement.
 */
export function usePlayerHand(): PlayerHandState {
  const [cardsInHand, setCardsInHand] = useState<CardOnTable[]>([]);
  const [playedCards, setPlayedCards] = useState<PlayedCard[]>([]);
  const [isPlayingCard, setIsPlayingCard] = useState(false);
  const [isDeckEmpty, setIsDeckEmpty] = useState(false);

  const topOfPile = playedCards[playedCards.length - 1] ?? null;

  // A new deck brings back cards that may still be leaving the screen from the
  // previous one, so the round number keeps their React keys apart.
  const dealRoundNumber = useRef(0);

  const putCardOnTable = useCallback(
    (card: Card): CardOnTable => ({
      card,
      tableId: `${dealRoundNumber.current}-${getCardId(card)}`,
    }),
    [],
  );

  const refillHand = useCallback(
    (currentHand: CardOnTable[]) => {
      const { hand, deckRanOut } = drawUpToFullHand(currentHand, putCardOnTable);
      setCardsInHand(hand);
      setIsDeckEmpty(deckRanOut);
    },
    [putCardOnTable],
  );

  // React runs mount effects twice in development, and dealing is not
  // repeatable — a second run would burn five more cards off the deck.
  const hasDealtOpeningHand = useRef(false);

  useEffect(() => {
    if (hasDealtOpeningHand.current) return;
    hasDealtOpeningHand.current = true;
    refillHand([]);
  }, [refillHand]);

  const playCard = useCallback(
    (tableId: string) => {
      // One card travels at a time, so each draw stays paired with its play.
      if (isPlayingCard) return;

      const cardBeingPlayed = cardsInHand.find(
        (handCard) => handCard.tableId === tableId,
      );
      if (!cardBeingPlayed) return;

      // The tilt is rolled here rather than in the updater below, so that it
      // is drawn exactly once even when React replays the updater.
      const cardJoiningPile: PlayedCard = {
        ...cardBeingPlayed,
        tiltInDegrees: pickRandomPlayedCardTilt(),
      };

      setPlayedCards((currentPile) => [...currentPile, cardJoiningPile]);
      setCardsInHand(
        cardsInHand.filter((handCard) => handCard.tableId !== tableId),
      );
      setIsPlayingCard(true);
    },
    [cardsInHand, isPlayingCard],
  );

  const finishPlayingCard = useCallback(
    (tableId: string) => {
      // Only the card on top of the pile can end a play. Anything else is a
      // stray arrival — a card settling again after the window was resized.
      if (!isPlayingCard || topOfPile?.tableId !== tableId) return;

      setIsPlayingCard(false);
      refillHand(cardsInHand);
    },
    [cardsInHand, isPlayingCard, topOfPile, refillHand],
  );

  const startNewDeckAndDealAgain = useCallback(() => {
    dealRoundNumber.current += 1;
    replaceDeckWithFreshOne();
    setPlayedCards([]);
    setIsPlayingCard(false);
    refillHand([]);
  }, [refillHand]);

  return {
    cardsInHand,
    playedCards,
    isPlayingCard,
    isDeckEmpty,
    playCard,
    finishPlayingCard,
    startNewDeckAndDealAgain,
  };
}
