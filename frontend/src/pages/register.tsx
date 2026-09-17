import { PageLayout } from "@/components/layout/PageLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { DemonCircle } from "@/components/demons/DemonCircle";
import { WornFrame } from "@/components/layout/WornFrame";

export default function RegisterPage() {
  return (
    <PageLayout>
      <DemonCircle>
        <div className="w-96 max-w-full">
          <WornFrame className="md:px-8 md:py-8">
            <RegisterForm />
          </WornFrame>
        </div>
      </DemonCircle>
    </PageLayout>
  );
}
