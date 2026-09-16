import { CircleUserRoundIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import { isLogged } from "@/lib/user";

export function Header() {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
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
