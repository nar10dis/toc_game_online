import type { ReactNode } from "react";

export function FriendsSection({
  title = "",
  count = 0,
  emptyText = "Nobody here yet.",
  children,
}: {
  title?: string;
  count?: number;
  emptyText?: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-2xl font-bold">
        {title} <span className="text-muted-foreground">({count})</span>
      </h2>
      {count === 0 && <p className="font-body text-muted-foreground">{emptyText}</p>}
      {count > 0 && <ul className="divide-y divide-border">{children}</ul>}
    </section>
  );
}
