import type { ReactNode } from "react";
import Link from "next/link";

import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";
import { WornFrame } from "@/components/layout/WornFrame";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <WornFrame>
      <h2 className="font-heading text-2xl font-bold">{title}</h2>
      <div className="mt-4 space-y-2 font-body text-base">{children}</div>
    </WornFrame>
  );
}

export default function Terms() {
  return (
    <PageLayout>
      <div className="flex w-full max-w-4xl flex-col gap-8 pb-12">
        <div className="mb-4 text-center">
          <Title>Terms of Service</Title>
          <Subtitle>The rules for using TocGameOnline.</Subtitle>
        </div>

        <Section title="The service">
          <p>
            TocGameOnline lets you play the board game Tock online, against other players or
            against bots. It is a free student project made as part of the 42 curriculum.
          </p>
        </Section>

        <Section title="Your account">
          <ul className="list-disc space-y-2 pl-6">
            <li>You need an account to play. Give a valid email address when you sign up.</li>
            <li>Keep your password to yourself: you are responsible for what happens on your account.</li>
            <li>One person, one account.</li>
          </ul>
        </Section>

        <Section title="Fair play">
          <ul className="list-disc space-y-2 pl-6">
            <li>Do not cheat, and do not use bugs to win a game.</li>
            <li>Do not try to break, overload or attack the service.</li>
            <li>
              Do not use an offensive username, bio or avatar. Be respectful to the other players.
            </li>
          </ul>
          <p>If you break these rules, we may suspend or delete your account.</p>
        </Section>

        <Section title="Your content">
          <p>
            You keep the rights on the bio and avatar you upload. You allow us to show them to the
            other players while your account exists.
          </p>
        </Section>

        <Section title="No guarantee">
          <p>
            The service is provided as is. As a student project, it can be down, change or stop at
            any time, and game data may be lost.
          </p>
        </Section>

        <Section title="Privacy">
          <p>
            How we handle your data is explained in our{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </Section>
      </div>
    </PageLayout>
  );
}
