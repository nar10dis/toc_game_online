export type SessionUser = { id: number; name: string };

let refreshInProgress: Promise<boolean> | null = null;
let sessionInProgress: Promise<SessionUser | null> | null = null;

// Always a 200: null when nobody is logged in, so the console stays clean on /login.
// The backend refreshes the session itself, so parallel calls share one request.
export function getSession(): Promise<SessionUser | null> {
  if (sessionInProgress) {
    return sessionInProgress;
  }

  sessionInProgress = fetch("/api/auth/session")
    .then((response) => (response.ok ? response.json() : { user: null }))
    .then((body: { user: SessionUser | null }) => body.user)
    .catch(() => null)
    .finally(() => {
      sessionInProgress = null;
    });
  return sessionInProgress;
}

// The refresh_token changes on every refresh, so parallel refreshes would fail: they share one
export function refreshAuth(): Promise<boolean> {
  if (refreshInProgress) {
    return refreshInProgress;
  }

  refreshInProgress = fetch("/api/auth/refresh", { method: "POST" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInProgress = null;
    });
  return refreshInProgress;
}

export async function fetchWithRefresh(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, options);
  if (response.status !== 401) {
    return response;
  }

  const isRefreshed = await refreshAuth();
  if (!isRefreshed) {
    return response;
  }
  return fetch(url, options);
}

// The backend sends { message } when it refuses, we show it as is
export async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return String(body.message);
  } catch {
    return "Something went wrong.";
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await fetchWithRefresh("/api/auth/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

export async function logout(): Promise<void> {
  const response = await fetchWithRefresh("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}
