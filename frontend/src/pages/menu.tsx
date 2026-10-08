"use client";

import { HelpCircleIcon, LogOutIcon, PlayIcon, PlusIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { createGame, getCurrentGame, leaveGame, type CurrentGame } from "@/api/game";

import { GlobalChat } from "@/components/chat/GlobalChat";
import { DemonCampfire } from "@/components/demons/DemonCampfire";
import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/api/auth";
import { useUsername } from "@/api/user";

// h-auto and whitespace-normal undo the single-line sizing the Button ships with.
const bigButtonClasses =
  "h-auto min-h-32 w-full flex-col items-start justify-center gap-2 rounded-3xl p-6 text-left whitespace-normal";

export default function Menu() {
  const router = useRouter();
  const username = useUsername();
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  // undefined while we ask the server, null when we are in no game
  const [currentGame, setCurrentGame] = useState<CurrentGame | null | undefined>(undefined);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    getCurrentGame()
      .then(setCurrentGame)
      .catch(() => setCurrentGame(null));
  }, []);

  function handleResume() {
    if (!currentGame) return;
    router.push(currentGame.phase === "waiting" ? "/lobby" : "/play");
  }

  async function handleLeave() {
    if (!window.confirm("Are you sure you want to quit your current game ?")) return;
    setIsLeaving(true);
    setCreateError(null);
    try {
      await leaveGame();
      setCurrentGame(null);
    } catch (error) {
      setCreateError((error as Error).message);
    }
    setIsLeaving(false);
  }

  async function handleCreate() {
    // same as the other private pages: no session, back to the login
    if (!(await getSession())) {
      router.push("/login");
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      await createGame();
      // the lobby gets the game itself through the websocket
      router.push("/lobby");
    } catch (error) {
      setCreateError((error as Error).message);
      setIsCreating(false);
    }
  }

  let welcomeText = "Welcome !";
  if (username) {
    welcomeText = `Welcome, ${username} !`;
  }

  return (
    <PageLayout>
      <div className="w-full max-w-6xl">
        <div className="text-center">
          <p className="font-heading text-3xl font-bold wrap-anywhere md:text-4xl">
            {welcomeText}
          </p>
          <p className="mt-1 font-body text-base text-muted-foreground md:text-lg">
            Ready to play ?
          </p>
        </div>

        <div className="mt-2">
          <DemonCampfire />
        </div>

        <div className="mt-8 text-center md:mt-2">
          <Title>Game menu</Title>
          <Subtitle>Start a table of your own, or sit at someone else&apos;s.</Subtitle>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {currentGame ? (
            <>
              <Button onClick={handleResume} className={bigButtonClasses}>
                <span className="flex items-center gap-2 font-heading text-2xl font-bold md:text-3xl">
                  <PlayIcon className="size-7" />
                  Resume game
                </span>
                <span className="font-body text-base font-normal text-primary-foreground/80">
                  Your table is still waiting for you !
                </span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleLeave}
                disabled={isLeaving}
                className={bigButtonClasses}
              >
                <span className="flex items-center gap-2 font-heading text-2xl font-bold md:text-3xl">
                  <LogOutIcon className="size-7" />
                  {isLeaving ? "Leaving..." : "Quit game"}
                </span>
                <span className="font-body text-base font-normal text-secondary-foreground/75">
                  Leave your table for good, an AI plays in your place.
                </span>
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCreate}
                disabled={isCreating || currentGame === undefined}
                className={bigButtonClasses}
              >
                <span className="flex items-center gap-2 font-heading text-2xl font-bold md:text-3xl">
                  <PlusIcon className="size-7" />
                  {isCreating ? "Creating..." : "Create game"}
                </span>
                <span className="font-body text-base font-normal text-primary-foreground/80">
                  Create your own game, with your own players and own rules !
                </span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => router.push("/join-game")}
                disabled={currentGame === undefined}
                className={bigButtonClasses}
              >
                <span className="flex items-center gap-2 font-heading text-2xl font-bold md:text-3xl">
                  <UsersIcon className="size-7" />
                  Join game
                </span>
                <span className="font-body text-base font-normal text-secondary-foreground/75">
                  Join an already created game.
                </span>
              </Button>
            </>
          )}
        </div>

        {createError && (
          <p className="mt-6 text-center text-sm text-destructive">{createError}</p>
        )}

        <Separator className="my-6" />

        <Button
          variant="outline"
          onClick={() => router.push("/rules")}
          className="h-auto w-full gap-2 rounded-2xl p-4 text-lg"
        >
          <HelpCircleIcon className="size-5" />
          Some question about the rules ?
        </Button>

        <div className="mt-6">
          <GlobalChat />
        </div>
      </div>
    </PageLayout>
  );
}
