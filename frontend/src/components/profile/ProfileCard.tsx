import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/** The big profile card, with the avatar sitting on its top edge. */
export function ProfileCard({ name = "", email = "" }: { name?: string; email?: string }) {
  const initials = name.slice(0, 2).toUpperCase();

  return (
    // overflow-visible so the avatar can stick out of the card
    <Card className="relative min-h-[70svh] w-full overflow-visible rounded-3xl pt-24 shadow-xl">
      {/* z-10 keeps the avatar above the demons turning over the card */}
      <Avatar className="absolute top-0 left-1/2 z-10 size-36 -translate-x-1/2 -translate-y-1/2 shadow-xl ring-8 ring-card">
        <AvatarFallback className="font-heading text-5xl font-bold">{initials}</AvatarFallback>
      </Avatar>

      <CardContent className="flex flex-col items-center gap-10 px-6 md:px-16">
        <h1 className="font-heading text-4xl font-bold md:text-5xl">{name}</h1>

        <Separator />

        <div className="flex w-full max-w-md flex-col gap-6">
          <ProfileInfo label="Pseudo" value={name} />
          <ProfileInfo label="Email" value={email} />
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-body text-sm text-muted-foreground">{label}</span>
      <span className="font-body text-xl">{value}</span>
    </div>
  );
}
