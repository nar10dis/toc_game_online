import { motion } from "motion/react";
import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import { TEAM_COLORS } from "@/lib/game/boardGeometry";
import { SeatBadge } from "@/components/game/SeatBadge";

/* ************************************************************************** */
/*                                 CONST DEF                                  */
/* ************************************************************************** */

/** Confetti shot from each corner of the screen. */
const CONFETTI_PER_CORNER = 18;

/** Where each corner is, and which way is "into the screen" from it. */
const CORNERS = [
  { left: "0%", top: "100%", directionX: 1 },
  { left: "100%", top: "100%", directionX: -1 },
  { left: "0%", top: "0%", directionX: 1 },
  { left: "100%", top: "0%", directionX: -1 },
];

/** Always the same number for the same piece, so the confetti never changes between renders. */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

/** One piece of paper, shot out of a corner, then falling while it spins. */
function Confetto({ corner, index }: { corner: (typeof CORNERS)[number]; index: number }) {
  const seed = index + 1;
  const color = TEAM_COLORS[index % TEAM_COLORS.length];
  // how far it flies, in viewport units
  const flyX = (15 + pseudoRandom(seed) * 45) * corner.directionX;
  const flyY = -(20 + pseudoRandom(seed * 2) * 50);
  const fallY = 40 + pseudoRandom(seed * 3) * 40;
  const spin = (pseudoRandom(seed * 4) - 0.5) * 1440;
  const delay = pseudoRandom(seed * 5) * 1.5;
  const isTop = corner.top === "0%";

  return (
    <motion.span
      className="absolute block h-3 w-2 rounded-[2px]"
      style={{ left: corner.left, top: corner.top, backgroundColor: color }}
      initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
      animate={{
        x: [`0vw`, `${flyX}vw`, `${flyX * 1.2}vw`],
        // the bottom corners shoot up then fall, the top ones only fall
        y: isTop ? [`0vh`, `${fallY / 2}vh`, `${fallY + 30}vh`] : [`0vh`, `${flyY}vh`, `${flyY + fallY}vh`],
        rotate: spin,
        opacity: [1, 1, 0],
      }}
      transition={{ duration: 5, delay, ease: "easeOut", times: [0, 0.35, 1] }}
    />
  );
}

type WinScreenProps = {
  winnerSeat: number;
  winnerName: string;
  isMe: boolean;
};

/** Laid over the whole page once the game is over. */
export function WinScreen({ winnerSeat, winnerName, isMe }: WinScreenProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-background/70 backdrop-blur-sm">
      {/* the confetti never block the button */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {CORNERS.map((corner, cornerIndex) =>
          Array.from({ length: CONFETTI_PER_CORNER }, (_, index) => (
            <Confetto
              key={`${cornerIndex}-${index}`}
              corner={corner}
              index={cornerIndex * CONFETTI_PER_CORNER + index}
            />
          )),
        )}
      </div>

      <motion.div
        className="relative flex flex-col items-center gap-4 p-6 text-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.2 }}
      >
        <SeatBadge seat={winnerSeat} isTaken className="size-40 md:size-48" />
        <p
          className="max-w-full font-heading text-5xl font-bold wrap-anywhere md:text-6xl"
          style={{ color: TEAM_COLORS[winnerSeat] }}
        >
          {isMe ? "Victoire !" : `${winnerName} a gagné !`}
        </p>
        {isMe && <p className="max-w-full font-heading text-2xl wrap-anywhere md:text-3xl">Bravo, {winnerName} !</p>}
        <Button
          onClick={() => router.push("/menu")}
          className="mt-4 h-auto rounded-2xl px-8 py-3 text-lg"
        >
          Continuer
        </Button>
      </motion.div>
    </div>
  );
}
