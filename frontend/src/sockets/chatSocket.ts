import { io, type Socket } from "socket.io-client";

import { refreshAuth } from "@/api/auth";

let chatSocket: Socket | null = null;

/** The global chat socket. Only opened while a page shows the chat. */
export function getChatSocket(): Socket {
  if (chatSocket) {
    return chatSocket;
  }

  chatSocket = io("/chat", { path: "/ws/socket.io", autoConnect: false });

  // The server kicks us when the jwt is expired: get a fresh one and come back
  chatSocket.on("disconnect", async (reason) => {
    if (reason !== "io server disconnect") {
      return;
    }
    const isRefreshed = await refreshAuth();
    if (isRefreshed) {
      chatSocket?.connect();
    }
  });

  return chatSocket;
}
