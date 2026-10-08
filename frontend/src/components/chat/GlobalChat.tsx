import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_GLOBAL_CHAT_MESSAGE_LENGTH, useGlobalChat } from "@/hooks/useGlobalChat";

/** "14:05", in the local time of the reader. */
function formatTime(sentAt: number): string {
  return new Date(sentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** The chat every logged in player shares, shown on the menu. */
export function GlobalChat() {
  const { messages, sendMessage } = useGlobalChat();
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
    const answer = await sendMessage(text);
    setIsSending(false);

    if ("error" in answer) {
      setError("Message not sent.");
      return;
    }
    setError("");
    setDraft("");
  }

  return (
    <section className="w-full rounded-3xl border-2 border-border p-4 md:p-6">
      <h2 className="font-heading text-2xl font-bold">Global chat</h2>

      <ul ref={listRef} className="mt-2 flex h-48 flex-col gap-1 overflow-y-auto pr-1 font-body text-sm">
        {messages.length === 0 && (
          <li className="text-muted-foreground">No message yet. Say hi !</li>
        )}
        {messages.map((message) => (
          <li key={message.id} className="break-words">
            <span className="mr-1 text-xs text-muted-foreground">{formatTime(message.sentAt)}</span>
            <Link href={`/players/${message.userId}`} className="font-bold hover:underline">
              {message.pseudo}
            </Link>
            <span> : {message.text}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={MAX_GLOBAL_CHAT_MESSAGE_LENGTH}
          placeholder="Write a message..."
          aria-label="Message"
        />
        <Button type="submit" size="icon" disabled={isSending || draft.trim() === ""} aria-label="Send">
          <SendIcon />
        </Button>
      </form>

      {error !== "" && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </section>
  );
}
