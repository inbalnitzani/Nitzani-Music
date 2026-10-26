import type { CSSProperties } from 'react';
import type { PhotoFraming } from '../types/person';

// The photo covers the frame with its (x, y) point at the frame's (x, y) point,
// then scales around that point. Everything is in percentages, so a 64px card
// circle shows exactly what the large editor circle showed.
function framedImageStyle({ x, y, zoom }: PhotoFraming): CSSProperties {
  return {
    objectPosition: `${x}% ${y}%`,
    transformOrigin: `${x}% ${y}%`,
    transform: zoom === 1 ? undefined : `scale(${zoom})`,
  };
}

export default function PersonPhoto({ url, framing, className = '' }: {
  url: string;
  framing: PhotoFraming;
  className?: string;
}) {
  return (
    <div className={`rounded-full overflow-hidden bg-[var(--color-border)] ${className}`}>
      <img src={url} alt="" draggable={false} className="w-full h-full object-cover" style={framedImageStyle(framing)} />
    </div>
  );
}
