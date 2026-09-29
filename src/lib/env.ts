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

/** The site's CMS id (`ESHOBE_SITE_ID`), set by the platform on every deployment. */
export function siteId(): string {
  return first(process.env.ESHOBE_SITE_ID)
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

/**
 * Headers for server→CMS REST.
 *
 * With a site API key the key names the tenant, and the request keeps the CMS's own
 * `Host`. It must: `ESHOBE_CMS_URL` is the CMS's public address behind the same Coolify
 * proxy that serves this theme, and that proxy routes by `Host`. Sending the customer
 * domain there hands the request back to this theme's own container (production lane)
 * or to no router at all (preview lane) — the site then renders empty after an 8s
 * timeout on every lookup. `Host` is only sent as the tenant when there is no key
 * (local dev against a host-routed CMS, or the legacy Caddy edge).
 */
export function cmsRequestHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json', ...extra }
  const key = siteApiKey()
  if (key) {
    headers.Authorization = `Bearer ${key}`
    return headers
  }
  const host = siteDomain()
  if (host) headers.Host = host
  return headers
}
