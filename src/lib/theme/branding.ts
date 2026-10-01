import type { Locale, Media, Ref, SiteBranding, SiteDescriptor } from '@/lib/types'

/** Theme demo identity when the CMS provides no site name or branding. */
export const DEMO_BRANDING: SiteBranding = {
  displayName: 'Graphite',
  displayNameFa: 'گرافیت — دفتر معماری',
  shortName: 'Graphite',
  tagline: null,
  logo: null,
  logoCompact: null,
  homeLogo: null,
  favicon: null,
  defaultOgImage: null,
}

export type ResolvedBranding = SiteBranding & {
  /** Customer-facing site name for the active locale. */
  siteName: string
  /** Accessible label for logo links and chrome. */
  brandLabel: string
}

/**
 * The uploaded mark a variant renders (THEME_API §branding): `logo` is the tenant's
 * primary mark (نشان اصلی) and `logoCompact` is the CMS's `compactLogo`, else the
 * primary. The chrome leads with the primary, so a site that uploaded only نشان اصلی
 * shows that mark everywhere; a dedicated home mark owns the full variant.
 */
export function logoMarkFor(
  branding: ResolvedBranding | null | undefined,
  variant: 'full' | 'compact',
): Ref<Media> | null {
  const primary = branding?.logo ?? null
  if (variant === 'full') return branding?.homeLogo ?? primary
  return primary ?? branding?.logoCompact ?? null
}

function mediaRef(media: Media | string | null | undefined): Media | null {
  if (!media || typeof media === 'string') return null
  return media
}

function pickName(site: SiteDescriptor | null, locale: Locale): string {
  const branding = site?.branding
  if (locale === 'fa') {
    return (
      branding?.displayNameFa?.trim() ||
      branding?.displayName?.trim() ||
      site?.name?.trim() ||
      DEMO_BRANDING.displayNameFa!
    )
  }
  return (
    branding?.displayName?.trim() ||
    branding?.displayNameFa?.trim() ||
    site?.name?.trim() ||
    DEMO_BRANDING.displayName!
  )
}

/** Customer identity from `GET /api/site`, with Graphite demo fallbacks for local dev. */
export function resolveBranding(site: SiteDescriptor | null, locale: Locale): ResolvedBranding {
  const branding = site?.branding
  const siteName = pickName(site, locale)
  const shortName = branding?.shortName?.trim() || site?.slug?.trim() || siteName
  return {
    displayName: branding?.displayName?.trim() || site?.name?.trim() || DEMO_BRANDING.displayName!,
    displayNameFa: branding?.displayNameFa?.trim() || site?.name?.trim() || DEMO_BRANDING.displayNameFa!,
    shortName,
    tagline: branding?.tagline?.trim() || null,
    logo: mediaRef(branding?.logo),
    logoCompact: mediaRef(branding?.logoCompact ?? branding?.logo),
    homeLogo: mediaRef(branding?.homeLogo ?? branding?.logo),
    favicon: mediaRef(branding?.favicon),
    defaultOgImage: mediaRef(branding?.defaultOgImage ?? branding?.ogImage),
    siteName,
    brandLabel: siteName,
  }
}
