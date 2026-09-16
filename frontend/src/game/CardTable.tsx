import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Transition } from "motion/react";

import { getCardFrenchLabel, getCardImagePath, type Card } from "@/game/cardDeck";
import {
  CARD_HEIGHT_IN_PIXELS,
  CARD_WIDTH_IN_PIXELS,
  CLEAR_TABLE_FALL,
  DEAL_IN_START_TRANSFORM,
  HAND_CARD_MOVEMENT,
  HOVER_LIFT_IN_PIXELS,
  PLAYED_CARD_TRAVEL,
  getCardOffScreenY,
  getHandCardTransform,
  getPlayedCardTransform,
  type CardTransform,
  type TableSize,
} from "@/game/cardLayout";
import type { CardOnTable, PlayedCard } from "@/game/usePlayerHand";

/**
 * Paint order of the bottom card of the pile. The pile stacks upwards from
 * here, well above the hand, so a card travelling to the middle passes over
 * the hand rather than under it.
 */
const BOTTOM_OF_PILE_STACKING_ORDER = 100;

/* ************************************************************************** */
/*                                 TABLE SIZE                                 */
/* ************************************************************************** */

/** Size of the table element, kept in sync when it resizes. 0x0 until measured. */
function useTableSize(tableRef: RefObject<HTMLDivElement | null>): TableSize {
  const [tableSize, setTableSize] = useState<TableSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    //the table follows the board, which resizes on zoom without a window resize.
    const observer = new ResizeObserver(() => {
      setTableSize({ width: table.clientWidth, height: table.clientHeight });
    });
    observer.observe(table);
    return () => observer.disconnect();
  }, [tableRef]);

  return tableSize;
}

/* ************************************************************************** */
/*                                 ONE  CARD                                  */
/* ************************************************************************** */

type SingleCardProps = {
  card: Card;
  /** Where the card rests right now: its slot in the hand, or the middle. */
  targetTransform: CardTransform;
  /** Paint order against the other cards on the table. */
  stackingOrder: number;
  /** How the card travels to `targetTransform`. */
  movementTransition: Transition;
  /** Where the card flies to when it leaves the table. */
  offScreenY: number;
  /** Plays the card, or `null` when it cannot be played right now. */
  onPlay: (() => void) | null;
  /** Called once the card has settled, which releases the next draw. */
  onArrived: (() => void) | null;
};

/**
 * One card: it deals in from the deck, travels to the middle when played, and
 * falls off the bottom of the screen when the table is cleared.
 */
function SingleCard({
  card,
  targetTransform,
  stackingOrder,
  movementTransition,
  offScreenY,
  onPlay,
  onArrived,
}: SingleCardProps) {
  const isPlayable = onPlay !== null;

  return (
    //outer element owns the position, inner one the hover lift, so the two
    //animations never fight over the same transform.
    <motion.div
      onClick={onPlay ?? undefined}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: CARD_WIDTH_IN_PIXELS,
        height: CARD_HEIGHT_IN_PIXELS,
        transformOrigin: "bottom center",
        cursor: isPlayable ? "pointer" : "default",
        //the table lets clicks through to the pawns, the cards take them back.
        pointerEvents: "auto",
        zIndex: stackingOrder,
      }}
      initial={{ ...DEAL_IN_START_TRANSFORM, opacity: 0 }}
      animate={{ ...targetTransform, opacity: 1 }}
      //only for "Nouveau paquet": a played card stays on the pile.
      exit={{ y: offScreenY, opacity: 0, transition: CLEAR_TABLE_FALL }}
      transition={movementTransition}
      onAnimationComplete={onArrived ?? undefined}
    >
      <motion.div
        whileHover={isPlayable ? { y: -HOVER_LIFT_IN_PIXELS } : undefined}
        style={{ width: "100%", height: "100%" }}
      >
        <Image
          src={getCardImagePath(card)}
          width={CARD_WIDTH_IN_PIXELS}
          height={CARD_HEIGHT_IN_PIXELS}
          alt={getCardFrenchLabel(card)}
          draggable={false}
        />
      </motion.div>
    </motion.div>
  );
}

/* ************************************************************************** */
/*                                 THE TABLE                                  */
/* ************************************************************************** */

/** A card of the table with everything `SingleCard` needs to draw it. */
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
  onPlayCard: (tableId: number) => void;
  onPlayedCardArrived: (tableId: number) => void;
};

/** Laid over the board: the hand the player holds, and the pile of played cards. */
export function CardTable({
  cardsInHand,
  playedCards,
  isPlayingCard,
  onPlayCard,
  onPlayedCardArrived,
}: CardTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const tableSize = useTableSize(tableRef);

  //the table is laid over the board and fills it; the cards are placed inside.
  const tableStyle = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  } as const;

  //the table size is unknown until it is measured; painting before then
  //would put every card in the top-left corner for one frame.
  if (tableSize.width === 0) {
    return <div ref={tableRef} style={tableStyle} />;
  }

  const offScreenY = getCardOffScreenY(tableSize);
  const topOfPile = playedCards[playedCards.length - 1] ?? null;

  //hand and pile go in ONE flat list: a played card must stay the very same
  //element as it was in the hand, so it carries on from where it sits instead
  //of being born again in the corner of the screen.
  const cardsOnTable: PositionedCard[] = cardsInHand.map(
    (handCard, positionInHand) => ({
      cardOnTable: handCard,
      targetTransform: getHandCardTransform(
        positionInHand,
        cardsInHand.length,
        tableSize,
      ),
      stackingOrder: positionInHand,
      movementTransition: HAND_CARD_MOVEMENT,
      //the hand is locked while a card is in flight, so one play always
      //finishes — and draws its replacement — before the next one starts.
      onPlay: isPlayingCard ? null : () => onPlayCard(handCard.tableId),
      onArrived: null,
    }),
  );

  playedCards.forEach((playedCard, positionInPile) => {
    cardsOnTable.push({
      cardOnTable: playedCard,
      targetTransform: getPlayedCardTransform(tableSize, playedCard.tiltInDegrees),
      stackingOrder: BOTTOM_OF_PILE_STACKING_ORDER + positionInPile,
      movementTransition: PLAYED_CARD_TRAVEL,
      onPlay: null,
      //only the top card is still arriving; the ones under it landed long
      //ago and must not release another draw.
      onArrived:
        playedCard.tableId === topOfPile?.tableId
          ? () => onPlayedCardArrived(playedCard.tableId)
          : null,
    });
  });

  //THE fix: drawn in the order they were dealt, never hand-then-pile. A card
  //keeps its rank among its siblings when it is played — the list only ever
  //grows at the end, as `tableId` counts up — so React has no reason to move
  //its element, and moving it is what used to remount the card and replay
  //`DEAL_IN_START_TRANSFORM`, sending it to the middle from the top-left corner.
  cardsOnTable.sort(
    (card, otherCard) => card.cardOnTable.tableId - otherCard.cardOnTable.tableId,
  );

  return (
    <div ref={tableRef} style={tableStyle}>
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
            <SingleCard
              key={cardOnTable.tableId}
              card={cardOnTable.card}
              targetTransform={targetTransform}
              stackingOrder={stackingOrder}
              movementTransition={movementTransition}
              offScreenY={offScreenY}
              onPlay={onPlay}
              onArrived={onArrived}
            />
          ),
        )}
      </AnimatePresence>
    </div>
  );
}
