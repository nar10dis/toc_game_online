/** Position of a point on a circle, in px from the circle centre. 0° is on the right, angles turn clockwise. */
export function pointOnCircle(angleInDegrees: number, radius: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: Math.cos(angleInRadians) * radius,
    y: Math.sin(angleInRadians) * radius,
  };
}
