/**
 * Copy of the backend types (backend/src/game/game.types.ts).
 * The backend is the reference: if it changes there, change it here.
 */

export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type CardColor = "heart" | "club" | "spade" | "diamond";
export type CardId = `${CardColor}_${CardValue}`;

export type Card = {
  id: CardId;
  color: CardColor;
  value: CardValue;
};

export type Seat = 0 | 1 | 2 | 3;

// board: cell 0 to 71, the same for everyone. home: cell 0 (door) to 3.
export type PawnPosition =
  | { zone: "spawn" }
  | { zone: "board"; cell: number }
  | { zone: "home"; cell: number };

export type Pawn = {
  id: number;
  playerSeat: Seat;
  position: PawnPosition;
};

export type GamePhase = "waiting" | "playing" | "finished";

/** Difficulty of a bot, chosen by the host in the waiting room. */
export const AI_LEVELS = ["easy", "medium", "hard"] as const;
export type AILevel = (typeof AI_LEVELS)[number];

export type PlayerView = {
  // null for a bot
  userId: number | null;
  pseudo: string;
  seat: Seat;
  // false: the player left, the AI plays for them until they come back
  isConnected: boolean;
  handCount: number;
};

/** A move I may play, and the cell it puts my pawn on. */
export type LegalMove = {
  action: GameAction;
  /** null for a swap or a discard: there is no cell to show. */
  to: PawnPosition | null;
};

/** The game as the server lets ME see it: only my hand, no draw pile. */
export type GameView = {
  id: number;
  inviteCode: string;
  phase: GamePhase;
  players: PlayerView[];
  pawns: Pawn[];
  discardPile: Card[];
  currentSeat: Seat;
  winner: Seat | null;
  // null = no 7 in progress, otherwise `left` steps remain to play with this card
  pendingSplit: { cardId: CardId; left: number } | null;
  /** One level per seat (index = seat), used when a bot plays there. */
  aiLevels: AILevel[];
  mySeat: Seat;
  myHand: Card[];
  drawPileCount: number;
  /** Empty when it is not my turn. */
  legalMoves: LegalMove[];
};

export type GameAction =
  | { type: "move"; cardId: CardId; pawnId: number }
  | { type: "enter"; cardId: CardId; pawnId: number }
  | { type: "exit"; cardId: CardId; pawnId: number }
  | { type: "swap"; cardId: CardId; pawnIdA: number; pawnIdB: number }
  // one piece of the 7: one emit per piece
  | { type: "split"; cardId: CardId; pawnId: number; steps: number; enter: boolean }
  | { type: "discard"; cardId: CardId };

/** What just happened, so we know what to animate. */
export type GameEvent = {
  seat: Seat;
  action: GameAction;
  captured: Pawn[];
  newRound: boolean;
};

/** Payload of the 'state' socket message. */
export type StateMessage = {
  state: GameView;
  event: GameEvent | null;
};

/** Answer of the server to an 'action' message. */
export type ActionAnswer = { ok: true } | { error: string };

/** Longest chat message the server accepts. */
export const MAX_CHAT_MESSAGE_LENGTH = 200;

/** One message of the game chat. */
export type ChatMessage = {
  id: number;
  seat: Seat;
  pseudo: string;
  text: string;
  /** Milliseconds since 1970, from the server clock. */
  sentAt: number;
};
