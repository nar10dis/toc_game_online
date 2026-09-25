import { motion } from "motion/react";

import {
  BOARD_SIZE,
  TEAM_COLORS,
  TEAMS_NUMBER,
  computeAvatarCoords,
} from "@/game/boardGeometry";
import { handDrawnCirclePath } from "@/game/handDrawn";

/* ************************************************************************** */
/*                                 CONST DEF                                  */
/* ************************************************************************** */

/**
 * Seat whose picture is left out: the player sits there, next to the cards.
 * Seat 3 is the one whose zones are drawn on the bottom arm — see `armOfSeat`.
 */
const BOTTOM_SEAT = 3;

const AVATAR_RADIUS = 78;

/** The drawings are 596 x 753, and this keeps that shape. */
const PICTURE_HEIGHT = 210;
const PICTURE_WIDTH = 166;

/** One drawing per team, in team order. */
const TEAM_PICTURES = [
  "/heart_demon.png",
  "/spade_demon.png",
  "/diamon_demon.png",
  "/club_demon.png",
];

/** Turns the black ink white and the white paper black, for the mask below. */
const INVERT_INK_FILTER = "invert-ink";

/**
 * In board units, so the name scales with the board. At the usual board width
 * (90vmin on a laptop screen) this lands on the site's --text-2xl.
 */
const NAME_FONT_SIZE = 50;
/** Gap between the top of the picture and the baseline of the name. */
const NAME_GAP = 12;

const DEFAULT_PLAYER_NAMES = ["Player 1", "Player 2", "Player 3", "Player 4"];

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

type PlayerAvatarsProps = {
  /** Its picture is not drawn — that player is the one holding the cards. */
  playerTeam?: number;
  /** Names of all the players, indexed by seat. */
  playerNames?: string[];
  /** Must match the `boardSize` of the `Board` these are drawn in. */
  boardSize?: number;
};

/** The other players' pictures, next to their spawn zone. Goes inside a `Board`. */
export function PlayerAvatars({
  playerTeam = BOTTOM_SEAT,
  playerNames = DEFAULT_PLAYER_NAMES,
  boardSize = BOARD_SIZE,
}: PlayerAvatarsProps) {
  const allTeams = Array.from({ length: TEAMS_NUMBER }, (_, team) => team);
  const shownTeams = allTeams.filter((team) => team !== playerTeam);

  return (
    <g>
      <defs>
        <filter id={INVERT_INK_FILTER} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"
          />
        </filter>

        {shownTeams.map((team) => {
          const { x, y } = computeAvatarCoords(team, boardSize);

          //a mask keeps what is white, so the inverted ink shows through and
          //the paper around the drawing disappears.
          return (
            <mask
              key={`picture-mask-${team}`}
              id={`picture-mask-${team}`}
              maskUnits="userSpaceOnUse"
              x={x - PICTURE_WIDTH / 2}
              y={y - PICTURE_HEIGHT / 2}
              width={PICTURE_WIDTH}
              height={PICTURE_HEIGHT}
            >
              <image
                href={TEAM_PICTURES[team]}
                x={x - PICTURE_WIDTH / 2}
                y={y - PICTURE_HEIGHT / 2}
                width={PICTURE_WIDTH}
                height={PICTURE_HEIGHT}
                preserveAspectRatio="xMidYMid meet"
                filter={`url(#${INVERT_INK_FILTER})`}
              />
            </mask>
          );
        })}
      </defs>

      {shownTeams.map((team) => {
        const { x, y } = computeAvatarCoords(team, boardSize);
        const color = TEAM_COLORS[team];

        return (
          <motion.g
            key={`avatar-${team}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + team * 0.1, duration: 0.3 }}
          >
            <text
              className="font-heading font-bold"
              x={x}
              y={y - AVATAR_RADIUS - NAME_GAP}
              textAnchor="middle"
              fill={color}
              fontSize={NAME_FONT_SIZE}
            >
              {playerNames[team]}
            </text>

            <path
              d={handDrawnCirclePath(x, y, AVATAR_RADIUS, 5000 + team)}
              fill={color}
              fillOpacity={0.14}
              stroke={color}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* the drawing itself, painted in the team colour through its mask */}
            <rect
              x={x - PICTURE_WIDTH / 2}
              y={y - PICTURE_HEIGHT / 2}
              width={PICTURE_WIDTH}
              height={PICTURE_HEIGHT}
              fill={color}
              mask={`url(#picture-mask-${team})`}
            />
          </motion.g>
        );
      })}
    </g>
  );
}
