import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type Tab = "log" | "chat" | "settings";

const TAB_LABELS: Record<Tab, string> = {
  log: "Journal",
  chat: "Chat",
  settings: "Paramètres",
};

type MobilePanelsProps = {
  log: ReactNode;
  chat: ReactNode;
  settings: ReactNode;
};

/**
 * The side menus of the game, for phones and portrait tablets: a row of tabs under the board.
 * All closed at first so the board gets the room; one open at a time, below it.
 */
export function MobilePanels({ log, chat, settings }: MobilePanelsProps) {
  const [openTab, setOpenTab] = useState<Tab | null>(null);
  const panels: Record<Tab, ReactNode> = { log, chat, settings };

  function toggle(tab: Tab) {
    setOpenTab(openTab === tab ? null : tab);
  }

  return (
    <div className="flex shrink-0 flex-col md:landscape:hidden">
      {openTab && (
        <div id="mobile-game-panel" className="flex h-[32svh] min-h-0 flex-col">
          {panels[openTab]}
        </div>
      )}

      <nav className="relative mt-2 flex justify-around pt-2" aria-label="Menus de la partie">
        {/* the worn line is drawn apart: as a mask it would wear the buttons too */}
        <div
          aria-hidden="true"
          className="worn-line pointer-events-none absolute inset-x-0 top-0 border-t border-current opacity-70"
        />
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <Button
            key={tab}
            variant="ghost"
            className="font-heading font-bold"
            aria-expanded={openTab === tab}
            aria-controls="mobile-game-panel"
            onClick={() => toggle(tab)}
          >
            {TAB_LABELS[tab]}
          </Button>
        ))}
      </nav>
    </div>
  );
}
