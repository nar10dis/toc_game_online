import { fetchWithRefresh, readError } from "@/api/auth";
import type { AILevel } from "@/lib/game/gameTypes";

export type GameCreated = { gameId: number; inviteCode: string };

export async function createGame(): Promise<GameCreated> {
  const response = await fetchWithRefresh("/api/game", { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export type CurrentGame = { gameId: number; phase: "waiting" | "playing" };

/** The unfinished game we are in, null if none. */
export async function getCurrentGame(): Promise<CurrentGame | null> {
  const response = await fetchWithRefresh("/api/game/current");
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const body: { game: CurrentGame | null } = await response.json();
  return body.game;
}

/** Waiting room: frees our seat. Running game: an AI takes our place for good. */
export async function leaveGame(): Promise<void> {
  const response = await fetchWithRefresh("/api/game/leave", { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

export async function joinGame(inviteCode: string): Promise<GameCreated> {
  const response = await fetchWithRefresh(`/api/game/join/${encodeURIComponent(inviteCode)}`, { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function startGame(gameId: number): Promise<void> {
  const response = await fetchWithRefresh(`/api/game/${gameId}/start`, { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

export async function setAILevel(gameId: number, seat: number, level: AILevel): Promise<void> {
  const response = await fetchWithRefresh(`/api/game/ai-level/${gameId}/${seat}/${level}`, { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
