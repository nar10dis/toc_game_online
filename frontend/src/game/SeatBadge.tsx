import { TEAM_COLORS } from "@/game/boardGeometry";
import { handDrawnCirclePath } from "@/game/handDrawn";
import { TEAM_PICTURES } from "@/game/PlayerAvatars";

/* ************************************************************************** */
/*                                 CONST DEF                                  */
/* ************************************************************************** */

/** Same proportions as the avatars drawn on the board. */
const VIEW_SIZE = 200;
const CIRCLE_RADIUS = 78;
const PICTURE_HEIGHT = 150;
const PICTURE_WIDTH = 118;

const EMPTY_COLOR = "var(--muted-foreground)";

/* ************************************************************************** */
/*                                 REACT FUNC                                 */
/* ************************************************************************** */

type SeatBadgeProps = {
  seat: number;
  /** An empty seat is drawn greyed out, with a dashed circle. */
  isTaken: boolean;
  className?: string;
};

/** The seat's demon in its team colour, like on the board, outside of a `Board`. */
export function SeatBadge({ seat, isTaken, className }: SeatBadgeProps) {
  const center = VIEW_SIZE / 2;
  const color = isTaken ? TEAM_COLORS[seat] : EMPTY_COLOR;
  // ids must be unique in the page: the lobby draws the four seats side by side
  const filterId = `seat-badge-invert-${seat}`;
  const maskId = `seat-badge-mask-${seat}`;
  const pictureX = center - PICTURE_WIDTH / 2;
  const pictureY = center - PICTURE_HEIGHT / 2;

  return (
    <svg
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      className={className}
      opacity={isTaken ? 1 : 0.45}
      aria-hidden
    >
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"
          />
        </filter>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={pictureX}
          y={pictureY}
          width={PICTURE_WIDTH}
          height={PICTURE_HEIGHT}
        >
          <image
            href={TEAM_PICTURES[seat]}
            x={pictureX}
            y={pictureY}
            width={PICTURE_WIDTH}
            height={PICTURE_HEIGHT}
            preserveAspectRatio="xMidYMid meet"
            filter={`url(#${filterId})`}
          />
        </mask>
      </defs>

      <path
        d={handDrawnCirclePath(center, center, CIRCLE_RADIUS, 5000 + seat)}
        fill={color}
        fillOpacity={isTaken ? 0.14 : 0}
        stroke={color}
        strokeWidth={5}
        strokeDasharray={isTaken ? undefined : "14 12"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x={pictureX}
        y={pictureY}
        width={PICTURE_WIDTH}
        height={PICTURE_HEIGHT}
        fill={color}
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
