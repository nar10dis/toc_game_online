import { disconnectChatSocket } from "@/sockets/chatSocket";
import { disconnectFriendsSocket } from "@/sockets/friendsSocket";
import { disconnectSocket } from "@/sockets/gameSocket";

/**
 * Closes every socket when the user changes (login, logout, account deleted).
 * They all share one connection, and the server reads the jwt cookie only once,
 * when that connection opens: if a single socket stays open, the next ones reuse
 * it and the server still sees the previous user.
 */
export function disconnectAllSockets() {
  disconnectSocket();
  disconnectChatSocket();
  disconnectFriendsSocket();
}
