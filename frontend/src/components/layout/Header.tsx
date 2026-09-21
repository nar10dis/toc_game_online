import { CircleUserRoundIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import { useIsLogged } from "@/lib/user";

export function Header() {
  const router = useRouter();
  const isLogged = useIsLogged();

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
        <span className="font-heading text-xl font-bold">
          TocGameOnline.com
        </span>
      </Link>

      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Profil"
        onClick={() => router.push("/profile")}
        className="size-12 rounded-full"
      >
        <CircleUserRoundIcon className="size-8" />
      </Button>
    </header>
  );
}
