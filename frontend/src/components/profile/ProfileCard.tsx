import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { WornFrame } from "@/components/layout/WornFrame";

/** The big profile card, with the avatar sitting on its top edge. */
export function ProfileCard({ avatar, children }: { avatar?: ReactNode; children?: ReactNode }) {
  return (
    // overflow-visible so the avatar can stick out of the card
    <Card className="relative w-full overflow-visible rounded-3xl bg-background p-3 shadow-xl ring-0">
      {/* z-10 keeps the avatar above the demons turning over the card */}
      <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">{avatar}</div>

      {/* pt-24 leaves room for the avatar, whose ring hides the frame lines behind it */}
      <WornFrame className="flex-1 pt-24 pb-10 md:pt-24 md:pb-12">
        <CardContent className="flex flex-col items-center gap-8 px-6 md:px-16">{children}</CardContent>
      </WornFrame>
    </Card>
  );
}
