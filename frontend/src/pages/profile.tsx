import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { DemonCircle } from "@/components/demons/DemonCircle";
import { PageLayout } from "@/components/layout/PageLayout";
import { Subtitle } from "@/components/layout/Title";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { getMe } from "@/api/user";
import type { Me } from "@/api/user";

export default function Profile() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

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

  return (
    <PageLayout>
      {/* mt-20 leaves room for the avatar sticking out of the card */}
      <div className="mt-20 w-full max-w-4xl">
        <DemonCircle variant="over">
          <ProfileCard name={me.user.name} email={me.user.email}/>
        </DemonCircle>
      </div>
    </PageLayout>
  );
}
