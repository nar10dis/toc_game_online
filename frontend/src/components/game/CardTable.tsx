import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Transition } from "motion/react";

import { cardRuleOf } from "@/lib/rules/cardRules";
import { getCardFrenchLabel, getCardImagePath } from "@/lib/game/cardDeck";
import {
  CARD_HEIGHT_IN_PIXELS,
  CARD_WIDTH_IN_PIXELS,
  CLEAR_TABLE_FALL,
  DEAL_IN_START_TRANSFORM,
  HAND_CARD_MOVEMENT,
  HOVER_LIFT_IN_PIXELS,
  PLAYED_CARD_TRAVEL,
  getCardOffScreenY,
  getCardScale,
  getHandCardTransform,
  getPlayedCardTilt,
  getPlayedCardTransform,
  type CardTransform,
  type TableSize,
} from "@/lib/game/cardLayout";
import type { Card, CardId } from "@/lib/game/gameTypes";

/**
 * Paint order of the bottom card of the pile. The pile stacks upwards from
 * here, well above the hand, so a card travelling to the middle passes over
 * the hand rather than under it.
 */
const BOTTOM_OF_PILE_STACKING_ORDER = 100;

/** How long the pointer must rest on a card of the hand before its hint opens. */
const HINT_DELAY_MS = 800;
/** Width of the hint bubble. It is not scaled with the cards, to stay readable. */
const HINT_WIDTH_IN_PIXELS = 260;
/** Gap between the top of the hovered card and the bottom of the hint. */
const HINT_GAP_IN_PIXELS = 12;

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
  /** Raised above the hand: the player picked it and now chooses a pawn. */
  isSelected: boolean;
  /** Picks the card, or `null` when it cannot be picked right now. */
  onClick: (() => void) | null;
  /** Pointer enters / leaves the card, or `null` for a card with no hint. */
  onHoverChange: ((isHovered: boolean) => void) | null;
};

/**
 * One card: it deals in from the deck, travels to the middle when played, and
 * falls off the bottom of the screen when the pile is shuffled back.
 */
function SingleCard({
  card,
  targetTransform,
  stackingOrder,
  movementTransition,
  offScreenY,
  isSelected,
  onClick,
  onHoverChange,
}: SingleCardProps) {
  const isClickable = onClick !== null;

  let liftInPixels = 0;
  if (isSelected) {
    liftInPixels = -HOVER_LIFT_IN_PIXELS * 2;
  }

  return (
    //outer element owns the position, inner one the lift, so the two
    //animations never fight over the same transform.
    <motion.div
      onClick={onClick ?? undefined}
      onHoverStart={() => onHoverChange?.(true)}
      onHoverEnd={() => onHoverChange?.(false)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: CARD_WIDTH_IN_PIXELS,
        height: CARD_HEIGHT_IN_PIXELS,
        transformOrigin: "bottom center",
        cursor: isClickable ? "pointer" : "default",
        //the table lets clicks through to the pawns, the cards take them back.
        pointerEvents: "auto",
        zIndex: stackingOrder,
      }}
      initial={{ ...DEAL_IN_START_TRANSFORM, opacity: 0 }}
      animate={{ ...targetTransform, opacity: 1 }}
      exit={{ y: offScreenY, opacity: 0, transition: CLEAR_TABLE_FALL }}
      transition={movementTransition}
    >
      <motion.div
        animate={{ y: liftInPixels }}
        whileHover={isClickable ? { y: liftInPixels - HOVER_LIFT_IN_PIXELS } : undefined}
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
/*                                 CARD  HINT                                 */
/* ************************************************************************** */

type CardHintProps = {
  card: Card;
  /** Transform of the hovered card, to sit right above it. */
  cardTransform: CardTransform;
  tableSize: TableSize;
};

/** What the hovered card of the hand can do, shown above it. */
function CardHint({ card, cardTransform, tableSize }: CardHintProps) {
  const rule = cardRuleOf(card.value);
  if (!rule) return null;

  //the card scales from its bottom centre: its middle stays at x + width / 2,
  //and its top edge comes down by the height it lost. The hover lift is
  //scaled with the card.
  const cardCenterX = cardTransform.x + CARD_WIDTH_IN_PIXELS / 2;
  const cardTopY =
    cardTransform.y +
    CARD_HEIGHT_IN_PIXELS * (1 - cardTransform.scale) -
    HOVER_LIFT_IN_PIXELS * cardTransform.scale;

  //kept inside the table, even above the cards at the ends of the hand.
  const halfWidth = HINT_WIDTH_IN_PIXELS / 2;
  const left = Math.min(Math.max(cardCenterX, halfWidth), tableSize.width - halfWidth);

  return (
    <motion.div
      className="rounded-lg border bg-card p-3 text-card-foreground shadow-md"
      style={{
        position: "absolute",
        left: left - halfWidth,
        bottom: tableSize.height - cardTopY + HINT_GAP_IN_PIXELS,
        width: HINT_WIDTH_IN_PIXELS,
        pointerEvents: "none",
        zIndex: BOTTOM_OF_PILE_STACKING_ORDER * 2,
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15 }}
    >
      <p className="font-heading text-base font-bold">{getCardFrenchLabel(card)}</p>
      <div className="font-body text-sm text-muted-foreground">{rule.text}</div>
    </motion.div>
  );
}

/* ************************************************************************** */
/*                                 THE TABLE                                  */
/* ************************************************************************** */

/** A card of the table with everything `SingleCard` needs to draw it. */
type PositionedCard = {
  card: Card;
  targetTransform: CardTransform;
  stackingOrder: number;
  movementTransition: Transition;
  isSelected: boolean;
  onClick: (() => void) | null;
  onHoverChange: ((isHovered: boolean) => void) | null;
};

type CardTableProps = {
  /** My hand, as the server sent it. */
  hand: Card[];
  /** The discard pile, bottom card first. */
  discardPile: Card[];
  selectedCardId?: CardId | null;
  /** False when it is not my turn: the hand cannot be clicked. */
  canPickCard?: boolean;
  onCardClick?: (cardId: CardId) => void;
};

/** Laid over the board: the hand the player holds, and the pile of played cards. */
export function CardTable({
  hand,
  discardPile,
  selectedCardId = null,
  canPickCard = false,
  onCardClick = () => {},
}: CardTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const tableSize = useTableSize(tableRef);
  const [hintCardId, setHintCardId] = useState<CardId | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  //the hint opens once the pointer has rested on the same card long enough.
  function handleHandCardHover(cardId: CardId, isHovered: boolean) {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = null;
    if (!isHovered) {
      setHintCardId(null);
      return;
    }
    hintTimerRef.current = setTimeout(() => setHintCardId(cardId), HINT_DELAY_MS);
  }

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

  const cardsOnTable: PositionedCard[] = hand.map((card, positionInHand) => {
    let onClick: (() => void) | null = null;
    if (canPickCard) {
      onClick = () => onCardClick(card.id);
    }

    return {
      card,
      targetTransform: getHandCardTransform(positionInHand, hand.length, tableSize),
      stackingOrder: positionInHand,
      movementTransition: HAND_CARD_MOVEMENT,
      isSelected: card.id === selectedCardId,
      onClick,
      onHoverChange: (isHovered: boolean) => handleHandCardHover(card.id, isHovered),
    };
  });

  discardPile.forEach((card, positionInPile) => {
    cardsOnTable.push({
      card,
      targetTransform: getPlayedCardTransform(tableSize, getPlayedCardTilt(card.id)),
      stackingOrder: BOTTOM_OF_PILE_STACKING_ORDER + positionInPile,
      movementTransition: PLAYED_CARD_TRAVEL,
      isSelected: false,
      onClick: null,
      onHoverChange: null,
    });
  });

  //a played card leaves the hand: its hint goes with it.
  const hintCardPosition = hand.findIndex((card) => card.id === hintCardId);
  let hint = null;
  if (hintCardPosition !== -1) {
    const hintCardTransform = getHandCardTransform(hintCardPosition, hand.length, tableSize);
    if (hand[hintCardPosition].id === selectedCardId) {
      hintCardTransform.y -= HOVER_LIFT_IN_PIXELS * 2 * getCardScale(tableSize);
    }
    hint = (
      <CardHint
        key="card-hint"
        card={hand[hintCardPosition]}
        cardTransform={hintCardTransform}
        tableSize={tableSize}
      />
    );
  }

  //a played card must stay the very same element as it was in the hand, so it
  //flies from where it sits. Sorting by id keeps every card at the same rank
  //among its siblings wherever it is, so React never moves its element.
  cardsOnTable.sort((card, otherCard) => card.card.id.localeCompare(otherCard.card.id));

  return (
    <div ref={tableRef} style={tableStyle}>
      <AnimatePresence>
        {cardsOnTable.map((positionedCard) => (
          <SingleCard
            key={positionedCard.card.id}
            card={positionedCard.card}
            targetTransform={positionedCard.targetTransform}
            stackingOrder={positionedCard.stackingOrder}
            movementTransition={positionedCard.movementTransition}
            offScreenY={offScreenY}
            isSelected={positionedCard.isSelected}
            onClick={positionedCard.onClick}
            onHoverChange={positionedCard.onHoverChange}
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>{hint}</AnimatePresence>
    </div>
  );
}
