import { useEffect, useState } from "react";

import { getSocket } from "@/sockets/gameSocket";
import type { ActionAnswer, ChatMessage } from "@/lib/game/gameTypes";

export type ChatState = {
  /** Oldest first. */
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<ActionAnswer>;
};

/** The chat of the game I am in: the server keeps the last messages for us. */
export function useChat(gameId: number | null): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const socket = getSocket();

    function handleChat(message: ChatMessage) {
      setMessages((previous) => [...previous, message]);
    }

    function handleChatHistory(history: ChatMessage[]) {
      setMessages(history);
    }

    // Ask for the history: we may have missed messages while away
    function handleConnect() {
      socket.emit("chat-sync");
    }

    socket.on("chat", handleChat);
    socket.on("chat-history", handleChatHistory);
    socket.on("connect", handleConnect);
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("chat", handleChat);
      socket.off("chat-history", handleChatHistory);
      socket.off("connect", handleConnect);
    };
  }, [gameId]);

  // The message comes back to us through 'chat', like everyone else
  function sendMessage(text: string): Promise<ActionAnswer> {
    return new Promise((resolve) => {
      if (gameId === null) {
        resolve({ error: "No game" });
        return;
      }
      getSocket().emit("chat", { gameId, text }, resolve);
    });
  }

  return { messages, sendMessage };
}
