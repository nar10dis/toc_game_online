import { useEffect, useState } from "react";

import { getSocket } from "@/sockets/gameSocket";
import type {
  ActionAnswer,
  GameAction,
  GameEvent,
  GameView,
  StateMessage,
} from "@/lib/game/gameTypes";

export type GameState = {
  /** null until the server answered. */
  game: GameView | null;
  /** What just happened, null when there is nothing to animate. */
  lastEvent: GameEvent | null;
  /** Every move seen since the page opened, oldest first. Empty after a reload. */
  events: GameEvent[];
  /** True when the server says we are in no game at all. */
  hasNoGame: boolean;
  sendAction: (action: GameAction) => Promise<ActionAnswer>;
};

/**
 * Listens to the server: every time the game changes (a join, the start, a
 * move from anyone, a bot included) the server pushes a 'state' message.
 */
export function useGame(): GameState {
  const [game, setGame] = useState<GameView | null>(null);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [hasNoGame, setHasNoGame] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    function handleState(message: StateMessage) {
      setGame(message.state);
      setLastEvent(message.event);
      setHasNoGame(false);
      // a 'sync' answer has no event: nothing was played
      const event = message.event;
      if (event) {
        setEvents((previous) => [...previous, event]);
      }
    }

    function handleNoGame() {
      setHasNoGame(true);
    }

    // Ask for the current state: we may have missed it while on another page
    function handleConnect() {
      socket.emit("sync");
    }

    socket.on("state", handleState);
    socket.on("no-game", handleNoGame);
    socket.on("connect", handleConnect);
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("state", handleState);
      socket.off("no-game", handleNoGame);
      socket.off("connect", handleConnect);
    };
  }, []);

  // The answer only says ok or why not: the new state comes through 'state'
  function sendAction(action: GameAction): Promise<ActionAnswer> {
    const socket = getSocket();

    return new Promise((resolve) => {
      if (!game) {
        resolve({ error: "No game" });
        return;
      }
      socket.emit("action", { gameId: game.id, action }, resolve);
    });
  }

  return { game, lastEvent, events, hasNoGame, sendAction };
}
