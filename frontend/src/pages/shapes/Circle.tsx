interface CircleProps {
  cx?: number;
  cy?: number;
  r?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  centered?: boolean;
}

export function Circle({
	cx = 0,
	cy = 0,
	r = 1,
	stroke = "black",
	strokeWidth = 2,
	fill = "none",
	centered=false
} : CircleProps) {
	return (
		<circle
			cx={centered ? cx + strokeWidth : cx + r + strokeWidth}
			cy={centered ? cy + strokeWidth : cy + r + strokeWidth}
			r={r}
			stroke={stroke}
			strokeWidth={strokeWidth}
			fill={fill}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	)
}
