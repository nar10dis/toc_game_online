import { PageLayout } from "@/components/layout/PageLayout";
import { Title } from "@/components/layout/Title";
import { LoginForm } from "@/components/auth/LoginForm";
import { DemonCircle } from "@/components/demons/DemonCircle";
import { WornFrame } from "@/components/layout/WornFrame";

const welcomePhrases = [
  "Toc toc toc ! Qui est là ?",
  "Jouer au toc pour pas finir toqué",
  "Ready to play the best game ever?",
  "Welcome to TocGameOnline.com",
];

// Picked on the server so the browser shows the same phrase without a flash
export function getServerSideProps() {
  const randomIndex = Math.floor(Math.random() * welcomePhrases.length);
  return { props: { welcomePhrase: welcomePhrases[randomIndex] } };
}

export default function LoginPage({ welcomePhrase }: { welcomePhrase: string }) {
  return (
    <PageLayout>
      <DemonCircle>
        <div className="flex flex-col items-center gap-8">
          <Title>{welcomePhrase}</Title>
          <div className="w-96 max-w-full">
            <WornFrame className="md:px-8 md:py-8">
              <LoginForm />
            </WornFrame>
          </div>
        </div>
      </DemonCircle>
    </PageLayout>
  );
}
