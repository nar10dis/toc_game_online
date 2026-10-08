import { useEffect, useState } from "react";

import { fetchWithRefresh, getSession, readError } from "@/api/auth";

export type Me = {
  userId: number;
  bio: string | null;
  avatarUrl: string | null;
  user: { name: string; email: string; createdAt: string };
  stats: { friendsCount: number; gamesPlayed: number };
};

export const BIO_MAX_LENGTH = 280;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

// Returns null when nobody is logged in (the backend answers 401)
export async function getMe(): Promise<Me | null> {
  const response = await fetchWithRefresh("/api/profile");
  if (!response.ok) {
    return null;
  }
  return response.json();
}


// Only the fields you pass are changed. Returns the updated profile.
export async function updateProfile(changes: { name?: string; bio?: string }): Promise<Me> {
  const response = await fetchWithRefresh("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function uploadAvatar(file: File): Promise<Me> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetchWithRefresh("/api/profile/avatar", { method: "POST", body: formData });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

// Back to the initials
export async function removeAvatar(): Promise<Me> {
  const response = await fetchWithRefresh("/api/profile/avatar", { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

// The backend asks the password again before deleting everything
export async function deleteAccount(password: string): Promise<void> {
  const response = await fetchWithRefresh("/api/profile", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
}

// The jwt cookie is httpOnly, so asking the backend is the only way to know if we are logged in
export function useIsLogged(): boolean {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    getSession().then((user) => {
      if (user) {
        setIsLogged(true);
      }
    });
  }, []);

  return isLogged;
}

export function useUsername(): string | null {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    getSession().then((user) => {
      if (user) {
        setUsername(user.name);
      }
    });
  }, []);

  return username;
}
