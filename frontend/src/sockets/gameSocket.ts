import { io, type Socket } from "socket.io-client";

import { refreshAuth } from "@/api/auth";

let socket: Socket | null = null;

/**
 * One socket for the whole app: it survives page changes.
 * Created on first use only, because Next also renders pages on the server
 * where there is no browser to connect from.
 */
export function getSocket(): Socket {
  if (socket) {
    return socket;
  }

  // Same origin as the page, nginx forwards /ws/ to the backend. The jwt
  // cookie goes with the handshake, that is how the server knows who we are.
  socket = io({ path: "/ws/socket.io" });

  // The server kicks us when the jwt is expired (it only lives 15 minutes):
  // get a fresh one and come back.
  socket.on("disconnect", async (reason) => {
    if (reason !== "io server disconnect") {
      return;
    }
    const isRefreshed = await refreshAuth();
    if (isRefreshed) {
      socket?.connect();
    }
  });

  return socket;
}
