import { useState } from "react";
import { useRouter } from "next/router";

import { createGame } from "@/api/game";
import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";
import { Button } from "@/components/ui/button";

export default function CreateGame() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    setIsCreating(true);
    setErrorMessage(null);
    try {
      await createGame();
      // the lobby gets the game itself through the websocket
      router.push("/lobby");
    } catch (error) {
      setErrorMessage((error as Error).message);
      setIsCreating(false);
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <Title>Create game</Title>
          <Subtitle>Open a table, share its code. Empty seats are taken by bots.</Subtitle>
        </div>
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create the table"}
        </Button>
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      </div>
    </PageLayout>
  );
}
