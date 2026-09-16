import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";

export default function Profile() {
  return (
    <PageLayout>
      <div className="text-center">
        <Title>Profile</Title>
        <Subtitle>Your account, your stats, your avatar. Coming soon.</Subtitle>
      </div>
    </PageLayout>
  );
}
