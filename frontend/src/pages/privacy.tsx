import type { ReactNode } from "react";

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

export default function Privacy() {
  return (
    <PageLayout>
      <div className="flex w-full max-w-4xl flex-col gap-8 pb-12">
        <div className="mb-4 text-center">
          <Title>Privacy Policy</Title>
          <Subtitle>What we collect about you, and why.</Subtitle>
        </div>

        <Section title="Who we are">
          <p>
            TocGameOnline is a student project made as part of the 42 curriculum. It is not a
            commercial service.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Account:</strong> your username, your email address and your password. The
              password is never stored as is: we only keep a salted hash of it.
            </li>
            <li>
              <strong>Profile:</strong> the bio and the avatar you choose to add.
            </li>
            <li>
              <strong>Games:</strong> the games you create or join, your seat, the dates and the
              result.
            </li>
          </ul>
        </Section>

        <Section title="Why we collect it">
          <ul className="list-disc space-y-2 pl-6">
            <li>To let you log in and keep your account safe.</li>
            <li>To show your profile to the players you meet.</li>
            <li>To run your games and keep their history.</li>
          </ul>
          <p>We never sell your data, and we do not use it for advertising.</p>
        </Section>

        <Section title="Cookies">
          <p>
            We only use two cookies, both needed to keep you logged in: <code>jwt</code> and{" "}
            <code>refresh_token</code>. They cannot be read by JavaScript, and the refresh token
            expires after 7 days. We use no tracking or advertising cookies.
          </p>
        </Section>

        <Section title="Who can see it">
          <p>
            Your username, bio and avatar are visible to the other players. Your email address and
            password are never shown to anyone. Your data stays on our server and is not shared
            with any third party.
          </p>
        </Section>

        <Section title="Security">
          <p>
            All traffic between your browser and our server goes through HTTPS. Passwords are
            hashed with bcrypt.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Under the GDPR, you can ask to see, correct or delete your data at any time. You can
            already edit your profile from the profile page. For anything else, contact the
            project team.
          </p>
        </Section>
      </div>
    </PageLayout>
  );
}
