/**
 * Platform contract env (Wave 11 / THEME_API §17b), with legacy aliases so local
 * Coolify deploys that still set ESHOBE_API_URL / ESHOBE_SITE_API_KEY keep working.
 */

const first = (...values: Array<string | undefined>): string => {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

/** CMS origin the theme calls — platform: `ESHOBE_CMS_URL`. */
export function cmsOrigin(): string {
  return first(
    process.env.ESHOBE_CMS_URL,
    process.env.ESHOBE_API_URL,
    process.env.NEXT_PUBLIC_ESHOBE_API_URL,
  ).replace(/\/$/, '')
}

/** Site API key — platform: `ESHOBE_API_KEY` (runtime-only). Read per request, never at build. */
export function siteApiKey(): string {
  return first(process.env.ESHOBE_API_KEY, process.env.ESHOBE_SITE_API_KEY)
}

/** Canonical customer hostname (no scheme). */
export function siteDomain(): string {
  return first(process.env.ESHOBE_SITE_DOMAIN).replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

/**
 * Origin this deployment is reachable at (preview host ≠ customer domain).
 * Prefer for absolute links; use `siteDomain` for canonical/SEO when set.
 */
export function publicOrigin(): string {
  const fromPlatform = first(process.env.ESHOBE_PUBLIC_ORIGIN)
  if (fromPlatform) return fromPlatform.replace(/\/$/, '')
  const legacy = first(process.env.NEXT_PUBLIC_SITE_URL)
  if (legacy) return legacy.replace(/\/$/, '')
  const domain = siteDomain()
  return domain ? `https://${domain}` : ''
}

/** Canonical site origin for sitemap/robots/hreflang when known. */
export function canonicalOrigin(): string {
  const domain = siteDomain()
  if (domain) return `https://${domain}`
  return publicOrigin()
}

export function revalidateSecret(): string {
  return first(process.env.ESHOBE_REVALIDATE_SECRET)
}

/** Headers for server→CMS REST: Bearer key and Host for tenant resolution. */
export function cmsRequestHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json', ...extra }
  const key = siteApiKey()
  if (key) headers.Authorization = `Bearer ${key}`
  const host = siteDomain()
  if (host) headers.Host = host
  return headers
}
