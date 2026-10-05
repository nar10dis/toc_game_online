import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CheckIcon, XIcon } from "lucide-react";

import { acceptFriendRequest, removeFriend } from "@/api/friends";
import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { FriendRow } from "@/components/friends/FriendRow";
import { FriendsSection } from "@/components/friends/FriendsSection";
import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFriends } from "@/friends/useFriends";

export default function Friends() {
  const router = useRouter();
  const { friendsList, isLoggedOut, errorMessage, reload } = useFriends();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedOut) {
      router.push("/login");
    }
  }, [isLoggedOut, router]);

  async function runAction(action: () => Promise<void>) {
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError((error as Error).message);
    }
    reload();
  }

  if (!friendsList) {
    let loadingText = "Loading your friends...";
    if (errorMessage) {
      loadingText = errorMessage;
    }
    return (
      <PageLayout>
        <Subtitle>{loadingText}</Subtitle>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Card className="w-full max-w-2xl rounded-3xl bg-background p-3 shadow-xl ring-0">
        <CardContent className="flex flex-col gap-8 p-4 md:p-8">
          <div>
            <Title>Friends</Title>
            <Subtitle>Add people by their pseudo.</Subtitle>
          </div>

          <AddFriendForm onSent={reload} />
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}

          <Separator />

          {friendsList.incoming.length > 0 && (
            <FriendsSection title="Requests" count={friendsList.incoming.length}>
              {friendsList.incoming.map((user) => (
                <FriendRow key={user.id} name={user.name} avatarUrl={user.avatarUrl}>
                  <Button size="lg" onClick={() => runAction(() => acceptFriendRequest(user.id))}>
                    <CheckIcon />
                    Accept
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => runAction(() => removeFriend(user.id))}>
                    <XIcon />
                    Decline
                  </Button>
                </FriendRow>
              ))}
            </FriendsSection>
          )}

          <FriendsSection
            title="Friends"
            count={friendsList.friends.length}
            emptyText="No friends yet. Add someone above!"
          >
            {friendsList.friends.map((friend) => {
              let presence: "online" | "offline" = "offline";
              if (friend.isOnline) {
                presence = "online";
              }
              return (
                <FriendRow key={friend.id} name={friend.name} avatarUrl={friend.avatarUrl} presence={presence}>
                  <Button size="lg" variant="ghost" onClick={() => runAction(() => removeFriend(friend.id))}>
                    Remove
                  </Button>
                </FriendRow>
              );
            })}
          </FriendsSection>

          {friendsList.outgoing.length > 0 && (
            <FriendsSection title="Sent" count={friendsList.outgoing.length}>
              {friendsList.outgoing.map((user) => (
                <FriendRow key={user.id} name={user.name} avatarUrl={user.avatarUrl}>
                  <Button size="lg" variant="ghost" onClick={() => runAction(() => removeFriend(user.id))}>
                    Cancel
                  </Button>
                </FriendRow>
              ))}
            </FriendsSection>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
