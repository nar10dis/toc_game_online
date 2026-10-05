import { CircleUserRoundIcon, PlayIcon } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { FriendsLink } from "@/components/friends/FriendsLink";
import { Button } from "@/components/ui/button";
import { useIsLogged } from "@/api/user";
import { connectFriendsSocket } from "@/sockets/friendsSocket";

export function Header() {
  const router = useRouter();
  const isLogged = useIsLogged();

  // The header is on every page, so this keeps us online for our friends
  useEffect(() => {
    if (isLogged) {
      connectFriendsSocket();
    }
  }, [isLogged]);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-background px-6 py-4">
      <div
        aria-hidden
        className="worn-line pointer-events-none absolute inset-x-0 bottom-0 border-b border-current opacity-70"
      />
      <Link
        href={isLogged ? "/menu" : "/login"}
        className="flex items-center gap-3 text-foreground transition-opacity hover:opacity-70"
      >
        <span
          className="logo-mask size-14 shrink-0"
          role="img"
          aria-label="Logo TocGameOnline"
        />
        <span className="hidden font-heading text-xl font-bold sm:inline">
          TocGameOnline.com
        </span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4">
        {isLogged && (
          <Button
            size="lg"
            onClick={() => router.push("/menu")}
            className="h-10 gap-2 rounded-full px-4 font-heading text-lg font-bold"
          >
            <PlayIcon className="size-4 fill-current" />
            Play
          </Button>
        )}
        {isLogged && <FriendsLink />}
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Profil"
          onClick={() => router.push("/profile")}
          className="size-12 rounded-full"
        >
          <CircleUserRoundIcon className="size-8" />
        </Button>
      </div>
    </header>
  );
}
