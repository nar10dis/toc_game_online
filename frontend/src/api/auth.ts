let refreshInProgress: Promise<boolean> | null = null;

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
