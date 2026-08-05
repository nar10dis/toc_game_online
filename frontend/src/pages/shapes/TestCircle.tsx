import { Circle } from "./Circle";

interface TestCircleProps {
    cx?: number;
    cy?: number;
    r?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    centered?: boolean;
    label: number;
}

export function TestCircle({
    cx = 0,
    cy = 0,
    r = 1,
    stroke = "black",
    strokeWidth = 2,
    fill = "none",
    centered = false,
    label
}: TestCircleProps) {
    const centerX = centered ? cx + strokeWidth : cx + r + strokeWidth;
    const centerY = centered ? cy + strokeWidth : cy + r + strokeWidth;

    return (
        <>
            <Circle
                cx={cx}
                cy={cy}
                r={r}
                stroke={stroke}
                strokeWidth={strokeWidth}
                fill={fill}
                centered={centered}
            />
            <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={r}
                fill={stroke}
            >
                {label}
            </text>
        </>
    );
}
