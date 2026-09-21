import type { ReactNode } from "react";

import { TiltCard } from "@/components/rules/TiltCard";

type CardRuleProps = {
  name: string;
  imagePath: string;
  children: ReactNode;
};

export function CardRule({ name, imagePath, children }: CardRuleProps) {
  return (
    <div className="flex items-center gap-4">
      <TiltCard imagePath={imagePath} label={name} />
      <div>
        <p className="font-heading text-lg font-bold">{name}</p>
        <div className="font-body text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
