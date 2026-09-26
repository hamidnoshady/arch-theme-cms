/**
 * Graphite identity, reconstructed from the supplied references on a single
 * isometric grid (edge slope 0.44). Requires final brand approval — replace the
 * path data with the authoritative vector when it is supplied; every variant
 * reads from these constants.
 */
const STROKES = [
  // tower: outline, then ridge
  'M28 122V35L78 13L128 35V122L78 99Z',
  'M78 13V99',
  // wing: outline, then divider
  'M128 35L162 20L212 42V85L128 122',
  'M162 20V107',
] as const

const SHADE = [
  { d: 'M78 13L128 35V122L78 99Z', opacity: 0.16 },
  { d: 'M162 20L212 42V85L162 107Z', opacity: 0.08 },
] as const

const VIEWBOX = '22 7 196 121'

export function LogoSymbol({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      className={className}
      viewBox={VIEWBOX}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <g className="logo__shade" fill="currentColor">
        {SHADE.map((s) => (
          <path key={s.d} d={s.d} opacity={s.opacity} />
        ))}
      </g>
      <g
        className="logo__strokes"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="miter"
        strokeLinecap="square"
      >
        {STROKES.map((d, i) => (
          <path key={d} d={d} pathLength={1} style={{ ['--i' as string]: i }} />
        ))}
      </g>
    </svg>
  )
}

type LogoProps = {
  variant?: 'full' | 'compact' | 'symbol'
  animated?: boolean
  className?: string
  /** Accessible name; omit when the logo sits inside a labelled link. */
  label?: string
}

export function Logo({ variant = 'full', animated = false, className = '', label }: LogoProps) {
  const classes = ['logo', `logo--${variant}`, animated ? 'logo--animated' : '', className]
    .filter(Boolean)
    .join(' ')

  if (variant === 'symbol') return <LogoSymbol className={classes} title={label} />

  return (
    <span className={classes} dir="ltr" role={label ? 'img' : undefined} aria-label={label}>
      <LogoSymbol className="logo__symbol" />
      <span className="logo__type" aria-hidden="true">
        <span className="logo__wordmark">GRAPHITE</span>
        {variant === 'full' ? <span className="logo__subtitle">ARCHITECTURE OFFICE</span> : null}
      </span>
    </span>
  )
}
