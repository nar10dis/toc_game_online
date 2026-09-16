import { useId } from "react";

// Size of the demon PNGs in /public
const imageWidth = 596;
const imageHeight = 753;

/** A demon PNG painted in the current text colour. */
export function DemonDrawing({ image }: { image: string }) {
  const maskId = useId();

  // An SVG mask is drawn together with the shape, unlike a CSS mask whose edge flickers while rotating
  return (
    <svg
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      className="aspect-[596/753] h-24"
      aria-hidden="true"
    >
      <mask id={maskId} style={{ maskType: "alpha" }}>
        <image href={image} width={imageWidth} height={imageHeight} />
      </mask>
      <rect width={imageWidth} height={imageHeight} fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
