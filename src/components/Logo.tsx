import { GraphiteLogoMark } from './GraphiteLogoMark';

export function Logo({
  compact = false,
  animated = false,
}: {
  compact?: boolean;
  animated?: boolean;
}) {
  return (
    <div
      className={`logo ${compact ? 'logo--compact' : ''}`}
      aria-label="Graphite Architecture Office"
    >
      {compact ? <span className="wordmark">GRAPHITE</span> : <GraphiteLogoMark animated={animated} />}
    </div>
  );
}
