import type { PublicProfile } from "@/api/user";
import { BioQuote, ProfileStat } from "@/components/profile/ProfileDetails";

/** Another player's profile, read only. */
export function PlayerDetails({ profile }: { profile: PublicProfile }) {
  const memberSince = new Date(profile.user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-heading text-4xl font-bold break-all md:text-5xl">{profile.user.name}</h1>
        <span className="font-body text-sm text-muted-foreground">Member since {memberSince}</span>
      </div>

      {profile.bio && <BioQuote bio={profile.bio} />}

      <div className="flex gap-4">
        <ProfileStat label="Friends" value={profile.stats.friendsCount} />
        <ProfileStat label="Games played" value={profile.stats.gamesPlayed} />
      </div>
    </>
  );
}
