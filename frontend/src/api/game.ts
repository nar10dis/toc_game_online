export type GameCreated = { gameId: number; inviteCode: string };

// POST that retries once after refreshing the jwt (it only lives 15 minutes)
async function postWithRefresh(url: string): Promise<Response> {
  let response = await fetch(url, { method: "POST" });

  if (response.status === 401) {
    const refreshResponse = await fetch("/api/auth/refresh", { method: "POST" });
    if (!refreshResponse.ok) {
      return response;
    }
    response = await fetch(url, { method: "POST" });
  }
  return response;
}

// The backend sends { message } when it refuses, we show it as is
async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return String(body.message);
  } catch {
    return "Something went wrong.";
  }
}

export async function createGame(): Promise<GameCreated> {
  const response = await postWithRefresh("/api/game");
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function joinGame(inviteCode: string): Promise<GameCreated> {
  const response = await postWithRefresh(`/api/game/join/${encodeURIComponent(inviteCode)}`);
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function startGame(gameId: number): Promise<void> {
  const response = await postWithRefresh(`/api/game/start/${gameId}`);
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
