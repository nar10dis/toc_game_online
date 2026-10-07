import { useState } from "react";
import type { FormEvent } from "react";
import { UserPlusIcon } from "lucide-react";

import { sendFriendRequest } from "@/api/friends";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddFriendForm({ onSent }: { onSent?: () => void }) {
  const [name, setName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName === "") {
      return;
    }

    setIsSending(true);
    setMessage(null);
    try {
      const status = await sendFriendRequest(trimmedName);
      setHasError(false);
      if (status === "accepted") {
        setMessage(`You and ${trimmedName} are now friends!`);
      } else {
        setMessage(`Request sent to ${trimmedName}.`);
      }
      setName("");
      if (onSent) {
        onSent();
      }
    } catch (error) {
      setHasError(true);
      setMessage((error as Error).message);
    }
    setIsSending(false);
  }

  let messageClass = "text-sm text-muted-foreground";
  if (hasError) {
    messageClass = "text-sm text-destructive";
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Pseudo of your friend"
          aria-label="Pseudo of your friend"
          className="h-10"
        />
        <Button type="submit" disabled={isSending || name.trim() === ""} className="h-10 gap-2 px-4">
          <UserPlusIcon />
          Add
        </Button>
      </div>
      {message && <p className={messageClass}>{message}</p>}
    </form>
  );
}
