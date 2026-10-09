import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { DemonCircle } from "@/components/demons/DemonCircle";
import { PageLayout } from "@/components/layout/PageLayout";
import { Subtitle } from "@/components/layout/Title";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileDeleteForm } from "@/components/profile/ProfileDeleteForm";
import { ProfileDetails } from "@/components/profile/ProfileDetails";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ProfilePasswordForm } from "@/components/profile/ProfilePasswordForm";
import { logout } from "@/api/auth";
import { disconnectSocket } from "@/sockets/gameSocket";
import { getMe } from "@/api/user";
import type { Me } from "@/api/user";

export default function Profile() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "password" | "delete">("view");
  const [notice, setNotice] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    getMe().then((user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setMe(user);
    });
  }, [router]);

  if (!me) {
    return (
      <PageLayout>
        <Subtitle>Loading your profile...</Subtitle>
      </PageLayout>
    );
  }

  function handleSaved(savedMe: Me) {
    setMe(savedMe);
    setMode("view");
  }

  function handlePasswordChanged() {
    setNotice("Password changed. Your other devices will be logged out.");
    setMode("view");
  }

  async function handleLogout() {
    try {
      await logout();
      disconnectSocket();
      router.push("/login");
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  function openMode(newMode: "edit" | "password" | "delete") {
    setNotice(null);
    setMode(newMode);
  }

  let content = (
    <ProfileDetails
      me={me}
      onEdit={() => openMode("edit")}
      onChangePassword={() => openMode("password")}
      onLogout={handleLogout}
      onDeleteAccount={() => openMode("delete")}
    />
  );
  if (mode === "edit") {
    content = <ProfileEditForm me={me} onSaved={handleSaved} onCancel={() => setMode("view")} />;
  }
  if (mode === "password") {
    content = <ProfilePasswordForm onSaved={handlePasswordChanged} onCancel={() => setMode("view")} />;
  }
  if (mode === "delete") {
    content = <ProfileDeleteForm onDeleted={() => router.push("/login")} onCancel={() => setMode("view")} />;
  }

  const avatar = (
    <ProfileAvatar name={me.user.name} avatarUrl={me.avatarUrl} onChanged={setMe} onError={setAvatarError} />
  );

  return (
    <PageLayout>
      {/* mt-20 leaves room for the avatar sticking out of the card */}
      <div className="mt-20 w-full max-w-4xl">
        <DemonCircle variant="over">
          <ProfileCard avatar={avatar}>
            {avatarError && <p className="text-sm text-destructive">{avatarError}</p>}
            {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
            {content}
          </ProfileCard>
        </DemonCircle>
      </div>
    </PageLayout>
  );
}
