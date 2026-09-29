import Image from 'next/image'

import type { ResolvedBranding } from '@/lib/theme/branding'

/**
 * Site identity mark. The tenant's uploaded logo (SVG or raster, from the CMS
 * site branding) is the only artwork; with none uploaded the site name is set
 * as a wordmark. The theme ships no logo of its own.
 */
type LogoProps = {
  variant?: 'full' | 'compact'
  animated?: boolean
  className?: string
  /** Accessible name; omit when the logo sits inside a labelled link. */
  label?: string
  branding?: ResolvedBranding | null
  mediaOrigin?: string
}

function cmsLogo(branding: ResolvedBranding | null | undefined, variant: 'full' | 'compact', origin: string) {
  const media = variant === 'compact' ? branding?.logoCompact ?? branding?.logo : branding?.homeLogo ?? branding?.logo
  const url = media && typeof media === 'object' ? media.url : null
  if (!url || !media || typeof media !== 'object') return null
  const src =
    /^(https?:)?\/\//i.test(url) || url.startsWith('data:')
      ? url
      : origin
        ? new URL(url.startsWith('/') ? url : `/${url}`, `${origin}/`).toString()
        : url
  return { src, width: media.width ?? null, height: media.height ?? null }
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

  const remote = cmsLogo(branding ?? null, variant, mediaOrigin)
  if (remote) {
    const compact = variant !== 'full'
    // SVGs often carry no intrinsic size; the box is sized by CSS, the ratio by the file.
    const width = remote.width ?? (compact ? 160 : 480)
    const height = remote.height ?? (compact ? 48 : 320)
    return (
      <span className={`${classes} logo--uploaded`} role={label ? 'img' : undefined} aria-label={label}>
        <Image
          className="logo__image"
          src={remote.src}
          alt={label ? '' : branding?.brandLabel ?? ''}
          width={width}
          height={height}
          priority={!compact}
          unoptimized
        />
      </span>
    )
  }

  const wordmark = branding?.shortName?.trim() || branding?.siteName?.trim()
  if (variant === 'full') {
    return (
      <span className={`${classes} logo--text`} role={label ? 'img' : undefined} aria-label={label}>
        <span className="logo__wordmark logo__wordmark--large" aria-hidden="true">
          {branding?.siteName?.trim() || wordmark}
        </span>
        {branding?.tagline ? (
          <span className="logo__subtitle" aria-hidden="true">
            {branding.tagline}
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <span className={`${classes} logo--text`} role={label ? 'img' : undefined} aria-label={label}>
      <span className="logo__wordmark" aria-hidden="true">
        {wordmark}
      </span>
    </span>
  )
}
