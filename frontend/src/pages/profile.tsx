import { PageLayout } from "@/components/PageLayout";
import { Title, Subtitle } from "@/components/Title";

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
