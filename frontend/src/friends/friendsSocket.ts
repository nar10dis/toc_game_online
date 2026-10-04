import { io, type Socket } from "socket.io-client";

import { refreshAuth } from "@/api/auth";

let friendsSocket: Socket | null = null;

export function getFriendsSocket(): Socket {
  if (friendsSocket) {
    return friendsSocket;
  }

  friendsSocket = io("/friends", { path: "/ws/socket.io" });

  // The server kicks us when the jwt is expired: get a fresh one and come back
  friendsSocket.on("disconnect", async (reason) => {
    if (reason !== "io server disconnect") {
      return;
    }
    const isRefreshed = await refreshAuth();
    if (isRefreshed) {
      friendsSocket?.connect();
    }
  });

  return friendsSocket;
}

export function connectFriendsSocket() {
  const socket = getFriendsSocket();
  if (!socket.connected) {
    socket.connect();
  }
}
