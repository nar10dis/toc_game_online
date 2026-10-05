"use client";

import { FlaskConicalIcon, HelpCircleIcon, PlusIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/router";

import { createGame } from "@/api/game";

import { DemonCampfire } from "@/components/demons/DemonCampfire";
import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUsername } from "@/api/user";

// h-auto and whitespace-normal undo the single-line sizing the Button ships with.
const bigButtonClasses =
  "h-auto min-h-56 w-full flex-col items-start justify-center gap-4 rounded-3xl p-10 text-left whitespace-normal";

export default function Menu() {
  const router = useRouter();
  const username = useUsername();
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
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
          <p className="font-heading text-4xl font-bold md:text-5xl">
            {welcomeText}
          </p>
          <p className="mt-4 font-body text-lg text-muted-foreground md:text-xl">Ready to play ?</p>
        </div>

        <div className="mt-8">
          <DemonCampfire />
        </div>

        <div className="mt-16 text-center md:mt-4">
          <Title>Game menu</Title>
          <Subtitle>Start a table of your own, or sit at someone else&apos;s.</Subtitle>
        </div>

        <div className="mt-12 grid gap-12 md:grid-cols-2">
          <Button onClick={handleCreate} disabled={isCreating} className={bigButtonClasses}>
            <span className="flex items-center gap-2 font-heading text-3xl font-bold md:text-4xl">
              <PlusIcon className="size-8" />
              {isCreating ? "Creating..." : "Create game"}
            </span>
            <span className="font-body text-base font-normal text-primary-foreground/80">
              Create your own game, with your own players and own rules !
            </span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => router.push("/join-game")}
            className={bigButtonClasses}
          >
            <span className="flex items-center gap-2 font-heading text-3xl font-bold md:text-4xl">
              <UsersIcon className="size-8" />
              Join game
            </span>
            <span className="font-body text-base font-normal text-secondary-foreground/75">
              Join an already created game.
            </span>
          </Button>
        </div>

        {createError && (
          <p className="mt-6 text-center text-sm text-destructive">{createError}</p>
        )}

        <Separator className="my-16" />

        <Button
          variant="outline"
          onClick={() => router.push("/rules")}
          className="h-auto w-full gap-2 rounded-2xl p-6 text-lg"
        >
          <HelpCircleIcon className="size-5" />
          Some question about the rules ?
        </Button>

        {/* Dev tool: jumps straight to the board, remove before release */}
        <Button
          onClick={() => router.push("/play")}
          className="mt-6 h-auto w-full gap-2 rounded-2xl bg-fuchsia-600 p-6 text-lg text-white hover:bg-fuchsia-700"
        >
          <FlaskConicalIcon className="size-5" />
          Test game
        </Button>
      </div>
    </PageLayout>
  );
}
