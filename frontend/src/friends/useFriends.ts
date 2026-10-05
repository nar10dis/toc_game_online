import { useEffect, useState } from "react";

import { getFriendsList } from "@/api/friends";
import type { FriendsList } from "@/api/friends";
import { getFriendsSocket } from "@/friends/friendsSocket";

export type FriendsState = {
  friendsList: FriendsList | null;
  isLoggedOut: boolean;
  errorMessage: string | null;
  reload: () => void;
};

export function useFriends(): FriendsState {
  const [friendsList, setFriendsList] = useState<FriendsList | null>(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Bumping this number triggers a new load
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // An older, slower answer must not overwrite a newer one
    let isOutdated = false;

    getFriendsList()
      .then((list) => {
        if (isOutdated) return;
        if (!list) {
          setIsLoggedOut(true);
          return;
        }
        setFriendsList(list);
        setErrorMessage(null);
      })
      .catch((error) => {
        if (isOutdated) return;
        setErrorMessage((error as Error).message);
      });

    return () => {
      isOutdated = true;
    };
  }, [reloadCount]);

  useEffect(() => {
    const socket = getFriendsSocket();

    function handleFriendsChanged() {
      setReloadCount((count) => count + 1);
    }

    socket.on("friends-changed", handleFriendsChanged);
    // We may have missed changes while disconnected
    socket.on("connect", handleFriendsChanged);
    return () => {
      socket.off("friends-changed", handleFriendsChanged);
      socket.off("connect", handleFriendsChanged);
    };
  }, []);

  function reload() {
    setReloadCount((count) => count + 1);
  }

  return { friendsList, isLoggedOut, errorMessage, reload };
}
