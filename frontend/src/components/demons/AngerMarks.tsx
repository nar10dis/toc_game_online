import { AnimatePresence, motion } from "motion/react";

// Three short strokes fanning out, like a cartoon character getting angry
const strokes = [
  { x1: 4, y1: 6, x2: 12, y2: 16 },
  { x1: 20, y1: 2, x2: 20, y2: 14 },
  { x1: 36, y1: 6, x2: 28, y2: 16 },
];

/** Little anger strokes that pop above a demon's head. */
export function AngerMarks({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.svg
          viewBox="0 0 40 20"
          className="absolute bottom-full left-1/2 h-5 w-10 -translate-x-1/2"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: [0, 1.3, 1, 1.15, 1] }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {strokes.map((stroke) => (
            <line
              key={stroke.x1}
              {...stroke}
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}
        </motion.svg>
      )}
    </AnimatePresence>
  );
}
