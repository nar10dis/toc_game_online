import { useEffect, useState } from "react";

export type Me = {
  userId: number;
  bio: string | null;
  avatarUrl: string | null;
  user: { name: string; email: string };
};

// Returns null when nobody is logged in (the backend answers 401)
export async function getMe(): Promise<Me | null> {
  let response = await fetch("/api/profile");

  // The jwt cookie only lives 15 minutes, the refresh_token gives us a new one
  if (response.status === 401) {
    const refreshResponse = await fetch("/api/auth/refresh", { method: "POST" });
    if (!refreshResponse.ok) {
      return null;
    }
    response = await fetch("/api/profile");
  }

  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function getUsername(): Promise<string | null> {
  const me = await getMe();
  if (!me) {
    return null;
  }
  return me.user.name;
}

// The jwt cookie is httpOnly, so asking the backend is the only way to know if we are logged in
export function useIsLogged(): boolean {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    getMe().then((me) => {
      if (me) {
        setIsLogged(true);
      }
    });
  }, []);

  return isLogged;
}

export function useUsername(): string | null {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    getUsername().then(setUsername);
  }, []);

  return username;
}
