const spokes = Array.from({ length: 8 }, (_, i) => i * 45);
const hub = 7;
const rim = 42;

function spokeLine(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const x0 = 50 + hub * Math.cos(rad);
  const y0 = 50 + hub * Math.sin(rad);
  const x1 = 50 + rim * Math.cos(rad);
  const y1 = 50 + rim * Math.sin(rad);
  return { x0, y0, x1, y1 };
}

export function Logo({
  compact = false,
  animated = false,
}: {
  compact?: boolean;
  animated?: boolean;
}) {
  return (
    <div
      className={`logo ${compact ? 'logo--compact' : ''} ${animated ? 'logo--animated' : ''}`}
      aria-label="Graphite Architecture Office"
    >
      <svg viewBox="0 0 100 100" role="img" aria-hidden={compact}>
        <title>Graphite</title>
        <g className="logo-mark" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle className="logo-draw" cx="50" cy="50" r={rim} pathLength="1" />
          {spokes.map((angle) => {
            const { x0, y0, x1, y1 } = spokeLine(angle);
            return (
              <line
                key={angle}
                className="logo-draw"
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                pathLength="1"
              />
            );
          })}
        </g>
        <circle className="logo-hub" cx="50" cy="50" r={hub} fill="currentColor" />
      </svg>
      <span className="wordmark">GRAPHITE</span>
      {!compact && <span className="tagline">ARCHITECTURE OFFICE</span>}
    </div>
  );
}
