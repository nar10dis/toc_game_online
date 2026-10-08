import { useState } from "react";
import type { FormEvent } from "react";

import { deleteAccount } from "@/api/user";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ProfileDeleteForm({ onDeleted, onCancel }: { onDeleted?: () => void; onCancel?: () => void }) {
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteAccount(password);
      if (onDeleted) onDeleted();
      return;
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
    setIsDeleting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-6">
      <h2 className="text-center font-heading text-2xl font-bold">Delete account</h2>
      <p className="text-center font-body text-sm text-muted-foreground">
        Your profile, friends and game history will be deleted. This can't be undone.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="delete-password">Password</Label>
        <PasswordInput
          id="delete-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="h-10"
        />
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" size="lg" disabled={isDeleting}>
          Delete my account
        </Button>
      </div>
    </form>
  );
}
