import { useEffect, useRef, useState, type FormEvent } from "react";
import { SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TEAM_COLORS } from "@/lib/game/boardGeometry";
import { MAX_CHAT_MESSAGE_LENGTH, type ActionAnswer, type ChatMessage } from "@/lib/game/gameTypes";

type ChatBoxProps = {
  /** Oldest first. */
  messages: ChatMessage[];
  onSend: (text: string) => Promise<ActionAnswer>;
};

/** "14:05", in the local time of the reader. */
function formatTime(sentAt: number): string {
  return new Date(sentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** The chat of the game. Folds away on a click on its title, like the log. */
export function ChatBox({ messages, onSend }: ChatBoxProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  // Newest at the bottom: follow it when a message arrives
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (text === "" || isSending) {
      return;
    }

    setIsSending(true);
    const answer = await onSend(text);
    setIsSending(false);

    if ("error" in answer) {
      setError("Message non envoyé.");
      return;
    }
    setError("");
    setDraft("");
  }

  return (
    <details open className="mt-6 w-full">
      <summary className="cursor-pointer font-heading text-lg font-bold">Chat</summary>

      <ul ref={listRef} className="mt-2 flex h-[18vh] flex-col gap-1 overflow-y-auto pr-1 text-sm">
        {messages.length === 0 && (
          <li className="text-muted-foreground">Aucun message pour l&apos;instant.</li>
        )}
        {messages.map((message) => (
          <li key={message.id} className="break-words">
            <span className="mr-1 text-xs text-muted-foreground">{formatTime(message.sentAt)}</span>
            <span className="font-bold" style={{ color: TEAM_COLORS[message.seat] }}>
              {message.pseudo}
            </span>
            <span> : {message.text}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          placeholder="Écrire un message..."
          aria-label="Message"
        />
        <Button type="submit" size="icon" disabled={isSending || draft.trim() === ""} aria-label="Envoyer">
          <SendIcon />
        </Button>
      </form>

      {error !== "" && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </details>
  );
}
