import { SECTIONS, href } from './i18n'
import { HOME_SLUG, POSTS_SEGMENT } from '@eshobe/site-runtime'
import type { PageRole } from './theme/sections'
import type { LinkField, Locale, Page, Post, Section } from './types'

export type ResolvedLink = { href: string; external: boolean; newTab: boolean }

const isSection = (slug: string): slug is Section => (SECTIONS as string[]).includes(slug)

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
    return { href: url, external: /^(https?:)?\/\//i.test(url) || /^(mailto|tel|geo):/i.test(url), newTab }
  }
  const target = referenceHref(link.reference, locale, roles)
  return target ? { href: target, external: false, newTab } : null
}

/** Only allow safe URL schemes from CMS content. */
export function safeHref(url: string): string | null {
  const trimmed = url.trim()
  if (/^(https?:|mailto:|tel:|geo:|\/|#)/i.test(trimmed)) return trimmed
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed
  return null
}
