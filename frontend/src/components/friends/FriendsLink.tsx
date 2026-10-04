import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import { useFriends } from "@/friends/useFriends";

export function FriendsLink() {
  const router = useRouter();
  const { friendsList } = useFriends();

  let requestsCount = 0;
  if (friendsList) {
    requestsCount = friendsList.incoming.length;
  }

  return (
    <Button
      variant="link"
      onClick={() => router.push("/friends")}
      className="h-auto gap-2 px-2 font-heading text-lg font-bold text-foreground"
    >
      Friends
      {requestsCount > 0 && (
        <span
          aria-label={`${requestsCount} friend requests`}
          className="flex size-5 items-center justify-center rounded-full bg-primary font-body text-xs text-primary-foreground"
        >
          {requestsCount}
        </span>
      )}
    </Button>
  );
}
