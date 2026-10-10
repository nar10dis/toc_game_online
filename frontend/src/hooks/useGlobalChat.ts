import { useEffect, useState } from "react";

import { getChatSocket } from "@/sockets/chatSocket";
import type { ActionAnswer } from "@/lib/game/gameTypes";

/** Longest message the server accepts. */
export const MAX_GLOBAL_CHAT_MESSAGE_LENGTH = 200;

export type GlobalChatMessage = {
  id: number;
  userId: number;
  pseudo: string;
  text: string;
  /** Milliseconds since 1970, from the server clock. */
  sentAt: number;
};

export type GlobalChatState = {
  /** Oldest first. */
  messages: GlobalChatMessage[];
  sendMessage: (text: string) => Promise<ActionAnswer>;
};

/** The chat shared by every logged in player. The server sends the history on each connect. */
export function useGlobalChat(): GlobalChatState {
  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);

  useEffect(() => {
    const socket = getChatSocket();

    function handleMessage(message: GlobalChatMessage) {
      setMessages((previous) => [...previous, message]);
    }

    function handleHistory(history: GlobalChatMessage[]) {
      setMessages(history);
    }

    socket.on("message", handleMessage);
    socket.on("history", handleHistory);
    // connect() twice in a row (StrictMode runs effects twice) joins /chat twice,
    // and every message then arrives twice: the socket is opened only once
    if (!socket.active) {
      socket.connect();
    } else if (socket.connected) {
      // Already connected from a previous visit: the server only sends the history on connect
      socket.emit("history", handleHistory);
    }

    return () => {
      socket.off("message", handleMessage);
      socket.off("history", handleHistory);
    };
  }, []);

  // The message comes back to us through 'message', like everyone else
  function sendMessage(text: string): Promise<ActionAnswer> {
    return new Promise((resolve) => {
      getChatSocket().emit("message", { text }, resolve);
    });
  }

  return { messages, sendMessage };
}
