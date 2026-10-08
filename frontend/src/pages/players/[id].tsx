import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { getSession } from "@/api/auth";
import { getPlayerProfile } from "@/api/user";
import type { PublicProfile } from "@/api/user";
import { DemonCircle } from "@/components/demons/DemonCircle";
import { PageLayout } from "@/components/layout/PageLayout";
import { Subtitle } from "@/components/layout/Title";
import { PlayerDetails } from "@/components/profile/PlayerDetails";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PlayerProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The id is only known once the router is ready
    if (!router.isReady) {
      return;
    }
    const userId = Number(router.query.id);
    if (!Number.isInteger(userId)) {
      setError("This player does not exist.");
      return;
    }

    getSession().then((user) => {
      // Our own profile has its own page, with the edit buttons
      if (user && user.id === userId) {
        router.replace("/profile");
        return;
      }
      getPlayerProfile(userId)
        .then(setProfile)
        .catch(() => setError("This player does not exist."));
    });
  }, [router]);

  if (error) {
    return (
      <PageLayout>
        <Subtitle>{error}</Subtitle>
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout>
        <Subtitle>Loading the profile...</Subtitle>
      </PageLayout>
    );
  }

  const initials = profile.user.name.slice(0, 2).toUpperCase();
  const avatar = (
    <Avatar className="size-36 shadow-xl ring-8 ring-background">
      {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.user.name} />}
      <AvatarFallback className="font-heading text-5xl font-bold">{initials}</AvatarFallback>
    </Avatar>
  );

  return (
    <PageLayout>
      {/* mt-20 leaves room for the avatar sticking out of the card */}
      <div className="mt-20 w-full max-w-4xl">
        <DemonCircle variant="over">
          <ProfileCard avatar={avatar}>
            <PlayerDetails profile={profile} />
          </ProfileCard>
        </DemonCircle>
      </div>
    </PageLayout>
  );
}
