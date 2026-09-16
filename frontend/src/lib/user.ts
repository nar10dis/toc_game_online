import { useEffect, useState } from "react";

// TODO: set to true once the login is done
export let isLogged = false;

// Other files can't reassign an imported variable, so they go through this function
export function setIsLogged(value: boolean) {
  isLogged = value;
}

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
