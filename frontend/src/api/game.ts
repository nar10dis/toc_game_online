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

export async function setAILevel(gameId: number, seat: number, level: AILevel): Promise<void> {
  const response = await fetchWithRefresh(`/api/game/ai-level/${gameId}/${seat}/${level}`, { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
