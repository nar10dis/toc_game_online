import { PageLayout } from "@/components/layout/PageLayout";
import { Title, Subtitle } from "@/components/layout/Title";

export default function CreateGame() {
  return (
    <PageLayout>
      <div className="text-center">
        <Title>Create game</Title>
        <Subtitle>Pick your players and your rules. Coming soon.</Subtitle>
      </div>
    </PageLayout>
  );
}
