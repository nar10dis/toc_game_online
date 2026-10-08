import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { leaveGame, setAILevel, startGame } from "@/api/game";
import { AI_LEVELS, type AILevel } from "@/lib/game/gameTypes";
import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";
import { Button } from "@/components/ui/button";
import { TEAM_COLORS, TEAMS_NUMBER } from "@/lib/game/boardGeometry";
import { SeatBadge } from "@/components/game/SeatBadge";
import { useGame } from "@/hooks/useGame";

/** Waiting room: refreshed live by the websocket each time someone joins. */
export default function Lobby() {
  const router = useRouter();
  const { game, hasNoGame } = useGame();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

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

  // the new level comes back to everybody through the websocket
  async function handleAILevel(seat: number, level: AILevel) {
    if (!game) return;
    setErrorMessage(null);
    try {
      await setAILevel(game.id, seat, level);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }

  // frees our seat: if we were the host, the next player takes over
  async function handleLeave() {
    if (!window.confirm("Are you sure you want to quit your current game ?")) return;
    setIsLeaving(true);
    setErrorMessage(null);
    try {
      await leaveGame();
      router.push("/menu");
    } catch (error) {
      setErrorMessage((error as Error).message);
      setIsLeaving(false);
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

  // the host is always on seat 0: the creator, or the next one if they left
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

        <ul className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {seats.map((seat) => {
            const player = game.players.find((onePlayer) => onePlayer.seat === seat);
            const isTaken = player !== undefined;
            let name = "Empty seat";
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
              <li key={seat} className="flex flex-col items-center gap-2">
                <SeatBadge seat={seat} isTaken={isTaken} className="size-28 md:size-32" />
                <span
                  className="max-w-full text-center font-heading text-lg font-bold wrap-anywhere"
                  style={{ color: isTaken ? TEAM_COLORS[seat] : undefined }}
                >
                  {name}
                </span>
                {!isTaken && (
                  <span className="text-sm text-muted-foreground">A bot plays if nobody comes</span>
                )}
                {/* the host picks the bot level, the others just see it */}
                {!isTaken && isHost && (
                  <div className="flex gap-1">
                    {AI_LEVELS.map((level) => (
                      <Button
                        key={level}
                        size="xs"
                        variant={game.aiLevels[seat] === level ? "default" : "outline"}
                        onClick={() => handleAILevel(seat, level)}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                )}
                {!isTaken && !isHost && (
                  <span className="text-sm text-muted-foreground">Bot level: {game.aiLevels[seat]}</span>
                )}
              </li>
            );
          })}
        </ul>

        {isHost && <Button onClick={handleStart}>Start the game</Button>}
        {!isHost && <Subtitle>Waiting for the host to start...</Subtitle>}
        <Button variant="outline" onClick={handleLeave} disabled={isLeaving}>
          {isLeaving ? "Leaving..." : "Quit game"}
        </Button>
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      </div>
    </PageLayout>
  );
}
