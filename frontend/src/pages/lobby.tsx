import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { startGame } from "@/api/game";
import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";
import { Button } from "@/components/ui/button";
import { TEAM_COLORS, TEAMS_NUMBER } from "@/game/boardGeometry";
import { useGame } from "@/game/useGame";

/** Waiting room: refreshed live by the websocket each time someone joins. */
export default function Lobby() {
  const router = useRouter();
  const { game, hasNoGame } = useGame();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // everybody is sent to the board as soon as the host starts
  useEffect(() => {
    if (game && game.phase !== "waiting") {
      router.push("/play");
    }
  }, [game, router]);

  async function handleStart() {
    if (!game) return;
    setErrorMessage(null);
    try {
      await startGame(game.id);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  if (hasNoGame) {
    return (
      <PageLayout>
        <Subtitle>You are not in any game.</Subtitle>
      </PageLayout>
    );
  }
  if (!game) {
    return (
      <PageLayout>
        <Subtitle>Connecting...</Subtitle>
      </PageLayout>
    );
  }

  // the host is always the one who created the table, on seat 0
  const isHost = game.mySeat === 0;
  const seats = Array.from({ length: TEAMS_NUMBER }, (_, seat) => seat);

  return (
    <PageLayout>
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <Title>Waiting room</Title>
          <Subtitle>Share this code with your friends</Subtitle>
          <p className="mt-4 font-heading text-4xl font-bold tracking-widest">{game.inviteCode}</p>
        </div>

        <ul className="flex flex-col gap-2 text-lg">
          {seats.map((seat) => {
            const player = game.players.find((onePlayer) => onePlayer.seat === seat);
            let name = "Bot (if nobody comes)";
            if (player) {
              name = player.pseudo;
            }
            if (player && !player.isConnected) {
              name = `${name} (disconnected, a bot will play)`;
            }
            if (seat === game.mySeat) {
              name = `${name} (you)`;
            }
            return (
              <li key={seat} style={{ color: TEAM_COLORS[seat] }} className="font-bold">
                {name}
              </li>
            );
          })}
        </ul>

        {isHost && <Button onClick={handleStart}>Start the game</Button>}
        {!isHost && <Subtitle>Waiting for the host to start...</Subtitle>}
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      </div>
    </PageLayout>
  );
}
