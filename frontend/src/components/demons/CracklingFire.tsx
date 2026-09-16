import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { randomBetween } from "@/lib/randomBetween";

// Same warm tones as the team colours, plus a pale yellow heart
const outerFlameColor = "var(--team-0)";
const middleFlameColor = "var(--team-1)";
const innerFlameColor = "#F2C766";
const emberColors = [outerFlameColor, middleFlameColor, innerFlameColor];

// Size of the drawing, the flames stand on the logs at the bottom
const drawingWidth = 120;
const drawingHeight = 150;

const newEmberEveryMs = 220;
const emberLifetimeMs = 1400;
// A crackle is a few sparks shooting out at once
const crackleEveryMinMs = 700;
const crackleEveryMaxMs = 1800;
const crackleLifetimeMs = 450;

// Flame outlines, each a wavy drop narrower than the one around it
const flames = [
  {
    color: outerFlameColor,
    path: "M60 18 C70 40 98 56 94 94 C92 116 78 128 60 128 C42 128 26 116 26 94 C26 74 40 64 46 44 C50 56 54 58 56 50 C58 40 56 30 60 18 Z",
    duration: 0.9,
    scaleY: [1, 1.07, 0.96, 1.05, 1],
    skewX: [0, -3, 2, -2, 0],
  },
  {
    color: middleFlameColor,
    path: "M62 46 C70 62 84 74 82 98 C80 116 72 126 60 126 C48 126 38 116 38 100 C38 84 48 78 52 64 C56 72 60 66 62 46 Z",
    duration: 0.7,
    scaleY: [1, 0.94, 1.08, 0.98, 1],
    skewX: [0, 3, -2, 2, 0],
  },
  {
    color: innerFlameColor,
    path: "M60 76 C66 88 72 96 71 108 C70 118 66 124 60 124 C54 124 49 118 49 110 C49 100 56 94 60 76 Z",
    duration: 0.55,
    scaleY: [1, 1.1, 0.92, 1.06, 1],
    skewX: [0, -2, 3, -1, 0],
  },
];

type Particle = {
  id: number;
  x: number;
  y: number;
  // Where it ends, relative to where it starts
  moveX: number;
  moveY: number;
  size: number;
  color: string;
  lifetimeMs: number;
  createdAt: number;
};

/** A cartoon campfire: flickering flames on crossed logs, embers floating up and sparks crackling out. */
export function CracklingFire() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    function addParticles(newParticles: Omit<Particle, "id" | "createdAt">[]) {
      const now = Date.now();
      const created = newParticles.map((particle) => {
        const withId = { ...particle, id: nextId.current, createdAt: now };
        nextId.current++;
        return withId;
      });

      setParticles((current) => {
        const alive = current.filter((particle) => now - particle.createdAt < particle.lifetimeMs);
        return [...alive, ...created];
      });
    }

    function addEmber() {
      addParticles([
        {
          x: randomBetween(45, 75),
          y: randomBetween(60, 90),
          moveX: randomBetween(-25, 25),
          moveY: -randomBetween(70, 110),
          size: randomBetween(2.5, 4.5),
          color: emberColors[Math.floor(Math.random() * emberColors.length)],
          lifetimeMs: emberLifetimeMs,
        },
      ]);
    }

    let crackleTimer: ReturnType<typeof setTimeout>;
    function crackle() {
      const sparkCount = Math.round(randomBetween(3, 6));
      const sparks = [];
      for (let index = 0; index < sparkCount; index++) {
        // Mostly upwards, fanning left and right
        const angle = randomBetween(-160, -20) * (Math.PI / 180);
        const distance = randomBetween(20, 45);
        sparks.push({
          x: 60 + randomBetween(-10, 10),
          y: 105,
          moveX: Math.cos(angle) * distance,
          moveY: Math.sin(angle) * distance,
          size: randomBetween(1.5, 2.5),
          color: innerFlameColor,
          lifetimeMs: crackleLifetimeMs,
        });
      }
      addParticles(sparks);
      crackleTimer = setTimeout(crackle, randomBetween(crackleEveryMinMs, crackleEveryMaxMs));
    }

    const emberTimer = setInterval(addEmber, newEmberEveryMs);
    crackleTimer = setTimeout(crackle, crackleEveryMinMs);

    return () => {
      clearInterval(emberTimer);
      clearTimeout(crackleTimer);
    };
  }, []);

  return (
    <svg
      viewBox={`0 0 ${drawingWidth} ${drawingHeight}`}
      className="h-44 overflow-visible"
      aria-hidden="true"
    >
      {/* Warm glow on the ground */}
      <motion.ellipse
        cx={60}
        cy={132}
        rx={70}
        ry={16}
        fill={middleFlameColor}
        animate={{ opacity: [0.25, 0.4, 0.3, 0.45, 0.25] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      />

      {flames.map((flame) => (
        <motion.path
          key={flame.color}
          d={flame.path}
          fill={flame.color}
          style={{ transformBox: "fill-box", originX: 0.5, originY: 1 }}
          animate={{ scaleY: flame.scaleY, skewX: flame.skewX }}
          transition={{ duration: flame.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Two crossed logs, drawn in the text colour like the demons */}
      <g fill="currentColor">
        <rect x={14} y={122} width={92} height={14} rx={7} transform="rotate(12 60 129)" />
        <rect x={14} y={122} width={92} height={14} rx={7} transform="rotate(-12 60 129)" />
      </g>

      {particles.map((particle) => (
        <motion.circle
          key={particle.id}
          cx={particle.x}
          cy={particle.y}
          r={particle.size}
          fill={particle.color}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: particle.moveX, y: particle.moveY, opacity: 0, scale: 0.3 }}
          transition={{ duration: particle.lifetimeMs / 1000, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}
