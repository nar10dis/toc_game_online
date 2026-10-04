import { fetchWithRefresh, readError } from "@/api/auth";

export type GameCreated = { gameId: number; inviteCode: string };

export async function createGame(): Promise<GameCreated> {
  const response = await fetchWithRefresh("/api/game", { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function joinGame(inviteCode: string): Promise<GameCreated> {
  const response = await fetchWithRefresh(`/api/game/join/${encodeURIComponent(inviteCode)}`, { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function startGame(gameId: number): Promise<void> {
  const response = await fetchWithRefresh(`/api/game/start/${gameId}`, { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
