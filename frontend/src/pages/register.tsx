import { PageLayout } from "@/components/layout/PageLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { DemonCircle } from "@/components/demons/DemonCircle";

export default function RegisterPage() {
  return (
    <PageLayout>
      <DemonCircle>
        <div className="w-96 max-w-full">
          <RegisterForm />
        </div>
      </DemonCircle>
    </PageLayout>
  );
}
