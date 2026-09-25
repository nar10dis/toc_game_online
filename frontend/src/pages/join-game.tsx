import { useState } from "react";
import { useRouter } from "next/router";

import { joinGame } from "@/api/game";
import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinGame() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const inviteCode = String(form.get("inviteCode")).trim().toUpperCase();

    setIsJoining(true);
    setErrorMessage(null);
    try {
      await joinGame(inviteCode);
      router.push("/lobby");
    } catch (error) {
      setErrorMessage((error as Error).message);
      setIsJoining(false);
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <Title>Join game</Title>
          <Subtitle>Type the code the host gave you.</Subtitle>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input name="inviteCode" placeholder="ABCD2345" maxLength={8} required />
          <Button type="submit" disabled={isJoining}>
            {isJoining ? "Joining..." : "Join"}
          </Button>
        </form>
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      </div>
    </PageLayout>
  );
}
