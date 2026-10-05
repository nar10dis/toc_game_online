import { useState } from "react";
import type { FormEvent } from "react";

import { BIO_MAX_LENGTH, updateProfile } from "@/api/user";
import type { Me } from "@/api/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileEditForm({
  me,
  onSaved,
  onCancel,
}: {
  me: Me;
  onSaved?: (me: Me) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(me.user.name);
  const [bio, setBio] = useState(me.bio ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // A new pseudo also renews the login cookie, so only send what changed
    const changes: { name?: string; bio?: string } = {};
    if (name.trim() !== me.user.name) {
      changes.name = name.trim();
    }
    if (bio.trim() !== (me.bio ?? "")) {
      changes.bio = bio;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      let savedMe = me;
      if (Object.keys(changes).length > 0) {
        savedMe = await updateProfile(changes);
      }
      if (onSaved) onSaved(savedMe);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-name">Pseudo</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={20}
          className="h-10"
        />
        <span className="text-sm text-muted-foreground">3 to 20 letters, digits, _ or -</span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-bio">Bio</Label>
        {/* No shadcn textarea in components/ui yet */}
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={BIO_MAX_LENGTH}
          rows={4}
          placeholder="A few words about you"
          className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none md:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <span className="self-end text-sm text-muted-foreground">
          {bio.length}/{BIO_MAX_LENGTH}
        </span>
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={isSaving}>
          Save
        </Button>
      </div>
    </form>
  );
}
