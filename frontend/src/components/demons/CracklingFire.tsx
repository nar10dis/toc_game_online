import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";

import { randomBetween } from "@/lib/randomBetween";

// Black and white like the drawing: everything is inked in the text colour
const inkColor = "currentColor";

// Size of the drawing, the flames stand on the logs at the bottom
const drawingWidth = 120;
const drawingHeight = 150;

const newEmberEveryMs = 220;
const emberLifetimeMs = 1400;
// A crackle is a few sparks shooting out at once
const crackleEveryMinMs = 700;
const crackleEveryMaxMs = 1800;
const crackleLifetimeMs = 450;

// The hand-drawn fire, inked in the text colour like the demons
const fireImage = "/demons/campfire.png";
// Size of the PNG in /public
const fireImageWidth = 480;
const fireImageHeight = 616;
// The drawing stands on the ground of the old logs, centred
const fireHeight = 140;
const fireWidth = (fireHeight * fireImageWidth) / fireImageHeight;
const fireX = (drawingWidth - fireWidth) / 2;

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

/** The hand-drawn campfire, with embers floating up and sparks crackling out. */
export function CracklingFire() {
  const maskId = useId();
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
          color: inkColor,
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
          color: inkColor,
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
      {/* Faint shadow breathing on the ground */}
      <motion.ellipse
        cx={60}
        cy={132}
        rx={70}
        ry={16}
        fill={inkColor}
        animate={{ opacity: [0.06, 0.12, 0.08, 0.14, 0.06] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* An SVG mask, like the demons: the PNG only gives the shape, the ink takes the text colour */}
      <mask id={maskId} style={{ maskType: "alpha" }}>
        <image href={fireImage} x={fireX} width={fireWidth} height={fireHeight} />
      </mask>
      <rect
        x={fireX}
        width={fireWidth}
        height={fireHeight}
        fill="currentColor"
        mask={`url(#${maskId})`}
      />

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
