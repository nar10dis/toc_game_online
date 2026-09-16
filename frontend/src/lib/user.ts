import { useEffect, useState } from "react";

// TODO: fetch the real username from the backend once auth is ready (e.g. GET /api/users/me)
export async function getUsername(): Promise<string> {
  return "player";
}

export function useUsername(): string | null {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    getUsername().then(setUsername);
  }, []);

  return username;
}
