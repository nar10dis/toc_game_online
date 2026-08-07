import { AnimatePresence, type Transition } from "motion/react";

import { HAND_CARD_MOVEMENT, PLAYED_CARD_TRAVEL } from "@/game/cardAnimation";
import {
  getFannedCardTransform,
  getPlayedCardTransform,
  type CardTransform,
  type ViewportSize,
} from "@/game/cardTableLayout";
import type { CardOnTable, PlayedCard } from "@/hooks/usePlayerHand";

import { SingleCardOnTable } from "./SingleCardOnTable";

/**
 * Paint order of the bottom card of the pile. The pile stacks upwards from
 * here, and starts well above the hand so a card travelling to the middle
 * passes over the fan rather than under it.
 */
const BOTTOM_OF_PILE_STACKING_ORDER = 100;

type PositionedCard = {
  cardOnTable: CardOnTable;
  targetTransform: CardTransform;
  stackingOrder: number;
  movementTransition: Transition;
  onPlay: (() => void) | null;
  onArrived: (() => void) | null;
};

type CardTableProps = {
  cardsInHand: CardOnTable[];
  playedCards: PlayedCard[];
  /** True while a played card is still travelling to the pile. */
  isPlayingCard: boolean;
  viewportSize: ViewportSize;
  onPlayCard: (tableId: string) => void;
  onPlayedCardArrived: (tableId: string) => void;
};

/** Everything on screen: the fan the player holds, and the pile of cards played. */
export function CardTable({
  cardsInHand,
  playedCards,
  isPlayingCard,
  viewportSize,
  onPlayCard,
  onPlayedCardArrived,
}: CardTableProps) {
  // The viewport is unknown until the first client render; rendering before
  // then would place every card in the top-left corner for one frame.
  if (viewportSize.width === 0) return null;

  // Hand and pile share one flat list so that playing a card is a reorder
  // rather than a remount: React keeps the element alive by its `tableId`, so
  // the card carries on from wherever it currently sits and glides to the
  // middle. Rendering the pile as a separate sibling would unmount and remount
  // the card, making it blink across instead.
  const cardsOnTable: PositionedCard[] = cardsInHand.map(
    (cardOnTable, positionInHand) => ({
      cardOnTable,
      targetTransform: getFannedCardTransform(
        positionInHand,
        cardsInHand.length,
        viewportSize,
      ),
      stackingOrder: positionInHand,
      movementTransition: HAND_CARD_MOVEMENT,
      // The hand is locked while a card is in flight, so that one play always
      // finishes — and draws its replacement — before the next one starts.
      onPlay: isPlayingCard ? null : () => onPlayCard(cardOnTable.tableId),
      onArrived: null,
    }),
  );

  const topOfPile = playedCards[playedCards.length - 1] ?? null;

  playedCards.forEach((playedCard, positionInPile) => {
    cardsOnTable.push({
      cardOnTable: playedCard,
      targetTransform: getPlayedCardTransform(
        viewportSize,
        playedCard.tiltInDegrees,
      ),
      stackingOrder: BOTTOM_OF_PILE_STACKING_ORDER + positionInPile,
      movementTransition: PLAYED_CARD_TRAVEL,
      onPlay: null,
      // Only the card on top is still arriving; the ones under it landed long
      // ago and must not release another draw.
      onArrived:
        playedCard.tableId === topOfPile?.tableId
          ? () => onPlayedCardArrived(playedCard.tableId)
          : null,
    });
  });

  return (
    <AnimatePresence>
      {cardsOnTable.map(
        ({
          cardOnTable,
          targetTransform,
          stackingOrder,
          movementTransition,
          onPlay,
          onArrived,
        }) => (
          <SingleCardOnTable
            key={cardOnTable.tableId}
            card={cardOnTable.card}
            targetTransform={targetTransform}
            stackingOrder={stackingOrder}
            viewportSize={viewportSize}
            movementTransition={movementTransition}
            onPlay={onPlay}
            onArrived={onArrived}
          />
        ),
      )}
    </AnimatePresence>
  );
}
