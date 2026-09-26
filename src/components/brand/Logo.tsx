import Image from 'next/image'

import type { ResolvedBranding } from '@/lib/theme/branding'

import { GraphiteLogoMark } from './GraphiteLogoMark'

/**
 * Site identity mark. CMS logos take precedence; the Graphite vector remains the
 * theme demo fallback when no tenant branding is configured.
 */
const STROKES = [
  'M28 122V35L78 13L128 35V122L78 99Z',
  'M78 13V99',
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
  branding?: ResolvedBranding | null
  mediaOrigin?: string
}

function cmsLogoUrl(branding: ResolvedBranding | null | undefined, variant: 'full' | 'compact', origin: string) {
  const media = variant === 'compact' ? branding?.logoCompact ?? branding?.logo : branding?.logo
  const url = media && typeof media === 'object' ? media.url : null
  if (!url) return null
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url
  return origin ? new URL(url.startsWith('/') ? url : `/${url}`, `${origin}/`).toString() : url
}

export function Logo({
  variant = 'full',
  animated = false,
  className = '',
  label,
  branding,
  mediaOrigin = '',
}: LogoProps) {
  const classes = ['logo', `logo--${variant}`, animated ? 'logo--animated' : '', className]
    .filter(Boolean)
    .join(' ')

  const remote = cmsLogoUrl(branding ?? null, variant === 'symbol' ? 'compact' : variant, mediaOrigin)
  if (remote) {
    return (
      <span className={classes} role={label ? 'img' : undefined} aria-label={label}>
        <Image
          className="logo__image"
          src={remote}
          alt={label ?? branding?.brandLabel ?? ''}
          width={variant === 'compact' ? 160 : 280}
          height={variant === 'compact' ? 48 : 80}
          unoptimized
        />
      </span>
    )
  }

  if (variant === 'full') {
    return (
      <span
        className={`${classes} logo--vector`}
        dir="ltr"
        role={label ? 'img' : undefined}
        aria-label={label}
      >
        <GraphiteLogoMark animated={animated} />
      </span>
    )
  }

  if (variant === 'symbol') return <LogoSymbol className={classes} title={label} />

  const wordmark = branding?.shortName?.trim() || branding?.siteName?.trim()
  return (
    <span className={classes} role={label ? 'img' : undefined} aria-label={label}>
      <LogoSymbol className="logo__symbol" />
      {wordmark ? (
        <span className="logo__type" aria-hidden="true">
          <span className="logo__wordmark">{wordmark}</span>
        </span>
      ) : null}
    </span>
  )
}
