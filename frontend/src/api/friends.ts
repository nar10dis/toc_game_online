import { fetchWithRefresh, readError } from "@/api/auth";

export type FriendUser = { id: number; name: string; avatarUrl: string | null };
export type Friend = FriendUser & { isOnline: boolean };
export type FriendsList = {
  friends: Friend[];
  incoming: FriendUser[];
  outgoing: FriendUser[];
};

export async function getFriendsList(): Promise<FriendsList | null> {
  const response = await fetchWithRefresh("/api/friends");
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

// "accepted" when that person had already asked us
export async function sendFriendRequest(name: string): Promise<"pending" | "accepted"> {
  const response = await fetchWithRefresh("/api/friends/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const body = await response.json();
  return body.status;
}

export async function acceptFriendRequest(userId: number): Promise<void> {
  const response = await fetchWithRefresh(`/api/friends/requests/${userId}/accept`, { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

// Also declines or cancels a request
export async function removeFriend(userId: number): Promise<void> {
  const response = await fetchWithRefresh(`/api/friends/${userId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
