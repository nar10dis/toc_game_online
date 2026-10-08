import { PencilIcon, PlusIcon } from "lucide-react";

import type { Me } from "@/api/user";
import { WornFrame } from "@/components/layout/WornFrame";
import { ProfileAccount } from "@/components/profile/ProfileAccount";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ProfileDetails({
  me,
  onEdit,
  onChangePassword,
  onLogout,
  onDeleteAccount,
}: {
  me: Me;
  onEdit?: () => void;
  onChangePassword?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
}) {
  const memberSince = new Date(me.user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="flex flex-col items-center gap-1 text-center">
        {/* The pencil hangs on the right so the name stays centered */}
        <div className="relative">
          <h1 className="font-heading text-4xl font-bold break-all md:text-5xl">{me.user.name}</h1>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Edit profile"
            title="Edit profile"
            onClick={onEdit}
            className="absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-full text-muted-foreground"
          >
            <PencilIcon />
          </Button>
        </div>
        <span className="font-body text-sm text-muted-foreground">Member since {memberSince}</span>
      </div>

      <ProfileBio bio={me.bio} onEdit={onEdit} />

      <div className="flex gap-4">
        <ProfileStat label="Friends" value={me.stats.friendsCount} />
        <ProfileStat label="Games played" value={me.stats.gamesPlayed} />
      </div>

      <Separator className="max-w-md" />

      <ProfileAccount
        email={me.user.email}
        onChangePassword={onChangePassword}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
      />
    </>
  );
}

function ProfileBio({ bio, onEdit }: { bio: string | null; onEdit?: () => void }) {
  if (!bio) {
    return (
      <Button variant="outline" onClick={onEdit} className="gap-2 rounded-full border-dashed px-4">
        <PlusIcon />
        Add a bio
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <blockquote className="relative max-w-md px-8 text-center font-body text-lg whitespace-pre-line wrap-anywhere">
        <span aria-hidden className="absolute -top-3 left-0 font-heading text-5xl leading-none text-primary/40">
          &ldquo;
        </span>
        {bio}
        <span aria-hidden className="absolute right-0 -bottom-6 font-heading text-5xl leading-none text-primary/40">
          &rdquo;
        </span>
      </blockquote>
      <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1.5 rounded-full text-muted-foreground">
        <PencilIcon />
        Edit bio
      </Button>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <WornFrame className="min-w-32 text-center md:min-w-36">
      <div className="flex flex-col items-center">
        <span className="font-heading text-4xl font-bold">{value}</span>
        <span className="font-body text-sm text-muted-foreground">{label}</span>
      </div>
    </WornFrame>
  );
}
