import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function FriendRow({
  name = "",
  avatarUrl = null,
  presence = "hidden",
  children,
}: {
  name?: string;
  avatarUrl?: string | null;
  presence?: "online" | "offline" | "hidden";
  children?: ReactNode;
}) {
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <li className="flex items-center gap-4 py-3">
      <div className="relative">
        <Avatar size="lg">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="font-heading font-bold">{initials}</AvatarFallback>
        </Avatar>
        {presence !== "hidden" && <PresenceDot isOnline={presence === "online"} />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-body text-lg">{name}</span>
        {presence === "online" && <span className="text-sm text-muted-foreground">Online</span>}
        {presence === "offline" && <span className="text-sm text-muted-foreground">Offline</span>}
      </div>

      <div className="flex gap-2">{children}</div>
    </li>
  );
}

function PresenceDot({ isOnline }: { isOnline: boolean }) {
  let colorClass = "bg-muted-foreground";
  if (isOnline) {
    colorClass = "bg-green-600";
  }

  return (
    <span
      aria-hidden
      className={`absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-background ${colorClass}`}
    />
  );
}
