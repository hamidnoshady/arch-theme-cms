import { SECTIONS, href } from './i18n'
import { HOME_SLUG, POSTS_SEGMENT } from '@eshobe/site-runtime'
import type { PageRole } from './theme/sections'
import type { LinkField, Locale, Page, Post, Section } from './types'

export type ResolvedLink = { href: string; external: boolean; newTab: boolean }

const isSection = (slug: string): slug is Section => (SECTIONS as string[]).includes(slug)

/**
 * A path on this site that no browser can read as another origin. `//evil.com` is
 * protocol-relative, and browsers fold `\` into `/`, so `/\evil.com` is too. Control
 * characters are refused because browsers strip them before parsing (`/\t/evil.com`).
 */
export function isSafeLocalPath(path: string): boolean {
  return /^\/(?![/\\])/.test(path) && !/[\u0000-\u001f\u007f\\]/.test(path)
}

/** `/en` and `/en/…` are already English; everything else under `/` is a Persian path. */
const englishPrefixed = (pathname: string) => pathname === '/en' || pathname.startsWith('/en/')

/**
 * An author-typed site path, in the locale being rendered. A header item saved as
 * `/projects` is the Projects section in every language; on an English page it must lead
 * to `/en/projects`, not to the Persian page. A path that already names English stays as
 * written, so an editor can still link across languages on purpose.
 */
export function localizePath(path: string, locale: Locale): string {
  const cut = path.search(/[?#]/)
  const pathname = cut === -1 ? path : path.slice(0, cut)
  const suffix = cut === -1 ? '' : path.slice(cut)
  if (locale === 'fa' || englishPrefixed(pathname)) return path
  return `${href(locale, pathname)}${suffix}`
}

export function pageHref(slug: string | null | undefined, locale: Locale): string {
  if (!slug || slug === HOME_SLUG) return href(locale)
  return href(locale, encodeURIComponent(slug))
}

/**
 * Posts are addressed through `/posts/<slug>`, the CMS's own post route, which
 * this theme redirects to `/projects/…` or `/education/…` after reading the
 * post's categories — so rich text never needs to know the section.
 */
export function postHref(slug: string | null | undefined, locale: Locale): string {
  return href(locale, slug ? `${POSTS_SEGMENT}/${encodeURIComponent(slug)}` : '')
}

/**
 * `roles` (page id → role, from `pageRoleIndex(site)`) sends a page the site owner bound to
 * «about» / «home» / … to that role's canonical URL whatever its own slug is. Without it only
 * the legacy rule applies: a page whose slug equals a section key.
 */
export function referenceHref(
  reference: { relationTo?: string; value?: unknown } | null | undefined,
  locale: Locale,
  roles?: ReadonlyMap<string, PageRole>,
): string | null {
  const value = reference?.value
  if (!value || typeof value !== 'object') return null
  const { id, slug } = value as Page | Post
  if (reference?.relationTo === 'posts') return slug ? postHref(slug, locale) : null
  const role = id ? roles?.get(id) : undefined
  if (role) return role === 'home' ? href(locale) : href(locale, role)
  if (!slug) return null
  return isSection(slug) ? href(locale, slug) : pageHref(slug, locale)
}

const EXTERNAL = /^(https?:)?\/\//i
const SCHEME = /^(mailto|tel|geo):/i

export function resolveLink(
  link: LinkField | null | undefined,
  locale: Locale,
  roles?: ReadonlyMap<string, PageRole>,
): ResolvedLink | null {
  if (!link) return null
  const newTab = Boolean(link.newTab)
  if (link.type === 'custom' || (!link.type && link.url)) {
    const url = link.url?.trim()
    if (!url) return null
    if (EXTERNAL.test(url) || SCHEME.test(url)) return { href: url, external: true, newTab }
    if (url.startsWith('#') || url.startsWith('?')) return { href: url, external: false, newTab }
    // Any other scheme (`javascript:`, `data:`) is refused outright.
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null
    // A bare `about` would resolve against the current URL; it means the site path `/about`.
    const path = url.startsWith('/') ? url : `/${url}`
    if (!isSafeLocalPath(path)) return null
    return { href: localizePath(path, locale), external: false, newTab }
  }
  const target = referenceHref(link.reference, locale, roles)
  return target ? { href: target, external: false, newTab } : null
}

/** Only allow safe URL schemes from CMS content. */
export function safeHref(url: string): string | null {
  const trimmed = url.trim()
  if (trimmed.startsWith('/')) return isSafeLocalPath(trimmed) ? trimmed : null
  if (/^(https?:|mailto:|tel:|geo:|#)/i.test(trimmed)) return trimmed
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed
  return null
}
