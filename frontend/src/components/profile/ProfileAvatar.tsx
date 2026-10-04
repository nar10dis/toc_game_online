import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { CameraIcon, Trash2Icon } from "lucide-react";

import { AVATAR_MAX_BYTES, removeAvatar, uploadAvatar } from "@/api/user";
import type { Me } from "@/api/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const acceptedTypes = "image/png,image/jpeg,image/webp,image/gif";

export function ProfileAvatar({
  name = "",
  avatarUrl = null,
  onChanged,
  onError,
}: {
  name?: string;
  avatarUrl?: string | null;
  onChanged?: (me: Me) => void;
  onError?: (message: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();

  async function runAvatarChange(change: () => Promise<Me>) {
    setIsBusy(true);
    if (onError) onError(null);
    try {
      const me = await change();
      if (onChanged) onChanged(me);
    } catch (error) {
      if (onError) onError((error as Error).message);
    }
    setIsBusy(false);
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still triggers a change
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      if (onError) onError("The image must be under 2 MB.");
      return;
    }
    runAvatarChange(() => uploadAvatar(file));
  }

  let avatarClass = "size-36 shadow-xl ring-8 ring-background";
  if (isBusy) {
    avatarClass = `${avatarClass} opacity-50`;
  }

  return (
    <div className="relative">
      <Avatar className={avatarClass}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="font-heading text-5xl font-bold">{initials}</AvatarFallback>
      </Avatar>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelected}
        className="hidden"
      />

      <Button
        size="icon-lg"
        aria-label="Change photo"
        disabled={isBusy}
        onClick={() => fileInputRef.current?.click()}
        className="absolute right-0 bottom-0 rounded-full shadow-md"
      >
        <CameraIcon />
      </Button>

      {avatarUrl && (
        <Button
          size="icon-lg"
          variant="outline"
          aria-label="Remove photo"
          disabled={isBusy}
          onClick={() => runAvatarChange(removeAvatar)}
          className="absolute bottom-0 left-0 rounded-full shadow-md"
        >
          <Trash2Icon />
        </Button>
      )}
    </div>
  );
}
