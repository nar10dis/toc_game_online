import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { joinGame } from "@/api/game";
import { PageLayout } from "@/components/layout/PageLayout";
import { Title } from "@/components/layout/Title";
import { WornFrame } from "@/components/layout/WornFrame";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function JoinGame() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const inviteCode = String(form.get("inviteCode")).trim().toUpperCase();

    setIsJoining(true);
    setErrorMessage(null);
    try {
      await joinGame(inviteCode);
      router.push("/lobby");
    } catch (error) {
      setErrorMessage((error as Error).message);
      setIsJoining(false);
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-col items-center gap-8">
        <Title>Join game</Title>
        <div className="w-96 max-w-full">
          <WornFrame className="md:px-8 md:py-8">
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <p className="text-center text-sm text-muted-foreground">
                  Type the code the host gave you.
                </p>
                <Field>
                  <FieldLabel htmlFor="inviteCode">Invite code</FieldLabel>
                  <Input
                    id="inviteCode"
                    name="inviteCode"
                    placeholder="ABCD2345"
                    maxLength={8}
                    required
                    autoComplete="off"
                    className="h-12 text-center font-heading text-xl tracking-widest uppercase md:text-xl"
                  />
                </Field>
                <Field>
                  {errorMessage && <FieldError>{errorMessage}</FieldError>}
                  <Button type="submit" disabled={isJoining}>
                    {isJoining ? "Joining..." : "Join"}
                  </Button>
                  <Link href="/menu" className={buttonVariants({ variant: "outline" })}>
                    Back to menu
                  </Link>
                </Field>
              </FieldGroup>
            </form>
          </WornFrame>
        </div>
      </div>
    </PageLayout>
  );
}
