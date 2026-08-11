import { useCallback, useEffect, useRef, useState } from "react";

import { createShuffledDeck, type Card, type Deck } from "@/game/cardDeck";
import { MAX_CARDS_IN_HAND, pickRandomPlayedCardTilt } from "@/game/cardLayout";

/* ************************************************************************** */
/*                                 TYPES DEF                                  */
/* ************************************************************************** */

export type CardOnTable = {
  card: Card;
  /**
   * Identity of the card for as long as it stays on the table, and also the
   * rank at which it was put there. Cards are drawn on screen in this order,
   * hand and pile alike, so playing a card never moves it among its siblings
   * and React keeps its element alive — see `CardTable`.
   */
  tableId: number;
};

export type PlayedCard = CardOnTable & {
  tiltInDegrees: number;
};

export type PlayerHandState = {
  cardsInHand: CardOnTable[];
  playedCards: PlayedCard[];
  isPlayingCard: boolean;
  isDeckEmpty: boolean;
  playCard: (tableId: number) => void;
  finishPlayingCard: (tableId: number) => void;
  startNewDeckAndDealAgain: () => void;
};

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

/** Holds the hand and the pile. Draws cards, but draws nothing on screen. */
export function usePlayerHand(): PlayerHandState {
  const [cardsInHand, setCardsInHand] = useState<CardOnTable[]>([]);
  const [playedCards, setPlayedCards] = useState<PlayedCard[]>([]);
  const [isPlayingCard, setIsPlayingCard] = useState(false);
  const [isDeckEmpty, setIsDeckEmpty] = useState(false);

  const deckRef = useRef<Deck | null>(null);
  const inFlightTableId = useRef<number | null>(null);
  //mirrors cardsInHand, so animation callbacks read the hand of *now*.
  const handRef = useRef<CardOnTable[]>([]);
  //cards are identified by a basic incremental id
  const cardsPutOnTable = useRef(0);

  const setHand = useCallback((hand: CardOnTable[]) => {
    handRef.current = hand;
    setCardsInHand(hand);
  }, []);

  const refillHand = useCallback(
    (currentHand: CardOnTable[]) => {
      //deck created at the first draw, then kept on the ref.
      const deck = (deckRef.current ??= createShuffledDeck());
      //[...tab] = spread operator -> create a copy of the tab
      const hand = [...currentHand];
      let deckRanOut = false;

      while (hand.length < MAX_CARDS_IN_HAND) {
        const drawnCard = deck.pop();
        if (!drawnCard) {
          deckRanOut = true;
          break;
        }
        cardsPutOnTable.current += 1;
        hand.push({ card: drawnCard, tableId: cardsPutOnTable.current });
      }

      setHand(hand);
      setIsDeckEmpty(deckRanOut);
    },
    [setHand],
  );

  //React runs mount effects twice in dev, and a second deal would burn 5 cards.
  const hasDealtOpeningHand = useRef(false);

  useEffect(() => {
    if (hasDealtOpeningHand.current) return;
    hasDealtOpeningHand.current = true;
    refillHand([]);
  }, [refillHand]);

  const playCard = useCallback(
    (tableId: number) => {
      //one card travels at a time, so each draw stays paired with its play.
      if (inFlightTableId.current !== null) return;

      const cardBeingPlayed = handRef.current.find(
        (handCard) => handCard.tableId === tableId,
      );
      if (!cardBeingPlayed) return;

      //tilt rolled here, not in the updater below, which React may replay.
      const cardJoiningPile: PlayedCard = {
        ...cardBeingPlayed,
        tiltInDegrees: pickRandomPlayedCardTilt(),
      };

      inFlightTableId.current = tableId;
      setPlayedCards((currentPile) => [...currentPile, cardJoiningPile]);
      setHand(handRef.current.filter((handCard) => handCard.tableId !== tableId));
      setIsPlayingCard(true);
    },
    [setHand],
  );

  const finishPlayingCard = useCallback(
    (tableId: number) => {
      //only the card in flight ends a play. This also rejects a pile card
      //settling after a resize, and the exit of a card wiped by a new deck.
      if (inFlightTableId.current !== tableId) return;

      inFlightTableId.current = null;
      setIsPlayingCard(false);
      refillHand(handRef.current);
    },
    [refillHand],
  );

  const startNewDeckAndDealAgain = useCallback(() => {
    //disowns any card still travelling, so its arrival is ignored above.
    inFlightTableId.current = null;
    deckRef.current = createShuffledDeck();
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
