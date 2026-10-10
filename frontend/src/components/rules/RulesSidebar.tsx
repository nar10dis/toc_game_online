import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type RuleSection = { id: string; title: string };

// A section counts as "being read" once its title has climbed above this share of the screen
const READING_LINE = 0.35;

/** The section the reader is on: the last one whose title has passed the reading line. */
function useActiveSection(sections: RuleSection[]) {
  const [activeId, setActiveId] = useState<string | undefined>(sections[0]?.id);

  useEffect(() => {
    function update() {
      // At the very bottom, the last sections may be too short to ever reach the line
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveId(sections.at(-1)?.id);
        return;
      }

      let current = sections[0]?.id;
      for (const section of sections) {
        const title = document.getElementById(section.id);
        if (title && title.getBoundingClientRect().top <= window.innerHeight * READING_LINE)
          current = section.id;
      }
      setActiveId(current);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  return activeId;
}

export function RulesSidebar({ sections }: { sections: RuleSection[] }) {
  const activeId = useActiveSection(sections);

  return (
    <nav aria-label="Rule sections" className="relative flex flex-col gap-1">
      <div
        aria-hidden
        className="worn-line pointer-events-none absolute inset-y-0 left-0 border-l border-current opacity-40"
      />
      {sections.map((section) => {
        const active = section.id === activeId;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active ? "location" : undefined}
            className={cn(
              "-ml-px border-l-2 py-1 pl-4 font-heading text-base transition-colors",
              active
                ? "border-foreground font-bold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {section.title}
          </a>
        );
      })}
    </nav>
  );
}
