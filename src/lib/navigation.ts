import { cache } from 'react'

import { getNav, getSectionCategories, getSectionPage } from '@/lib/cms'
import { SECTIONS, href, indexNumber } from '@/lib/i18n'
import { resolveLink, safeHref } from '@/lib/links'
import { resolveBindings } from '@/lib/theme/bindings'
import { ENTRY_KINDS, pageRoleIndex } from '@/lib/theme/sections'
import type { EntryKind, Locale, NavCollection, Section, SiteDescriptor } from '@/lib/types'

export type PrimaryNavItem = {
  id: string
  href: string
  label: string
  number: string
  external: boolean
  newTab: boolean
}

export type ActiveNav = {
  path: string
  /** True on the index route; false when a child (e.g. project detail) should highlight the parent. */
  exact: boolean
}

function normalizePath(path: string): string {
  if (!path || path === '/') return '/'
  return path.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/'
}

export function navItemActive(
  itemHref: string,
  active: ActiveNav | null | undefined,
): 'page' | 'true' | undefined {
  if (!active) return undefined
  const target = normalizePath(itemHref)
  const current = normalizePath(active.path)
  if (target === current) return active.exact ? 'page' : 'true'
  if (!active.exact && current.startsWith(`${target}/`)) return 'true'
  return undefined
}

/** The theme section a site path names in `locale` (`/en/projects` → `projects`), if any. */
export function sectionOfPath(path: string, locale: Locale): Section | null {
  const target = normalizePath(path)
  return SECTIONS.find((section) => href(locale, section) === target) ?? null
}

/**
 * Whether a section has something to show in `locale`. A page section needs its page
 * translated; a listing needs its root category. A menu never advertises a section
 * route that would only say "not published in this language".
 */
export const sectionAvailable = cache(async (section: Section, locale: Locale): Promise<boolean> => {
  if ((ENTRY_KINDS as string[]).includes(section)) {
    return Boolean((await getSectionCategories(section as EntryKind, locale)).root)
  }
  return Boolean(await getSectionPage(section, locale))
})

type Candidate = Omit<PrimaryNavItem, 'number'>

/**
 * CMS menu → validated items. An item survives only with a label in this locale and a
 * target that resolves to a safe URL; an internal target that is a theme section must
 * also have content in this locale. Numbers are assigned after filtering, so a dropped
 * item never leaves a gap ("01, 03").
 */
export async function validateNavItems(
  nav: NavCollection | null,
  locale: Locale,
  site: SiteDescriptor | null,
  available: (section: Section) => Promise<boolean> = (section) => sectionAvailable(section, locale),
): Promise<PrimaryNavItem[]> {
  const roles = pageRoleIndex(site)
  const candidates = await Promise.all(
    (nav?.navItems ?? []).map(async (item, index): Promise<Candidate | null> => {
      const label = item.link?.label?.trim()
      const resolved = resolveLink(item.link, locale, roles)
      const target = resolved?.href ? safeHref(resolved.href) : null
      if (!label || !resolved || !target) return null
      if (!resolved.external) {
        const section = sectionOfPath(target, locale)
        if (section && !(await available(section))) return null
      }
      return { id: item.id ?? `${index}-${target}`, href: target, label, external: resolved.external, newTab: resolved.newTab }
    }),
  )
  const seen = new Set<string>()
  return candidates
    .filter((item): item is Candidate => {
      if (!item || seen.has(item.href)) return false
      seen.add(item.href)
      return true
    })
    .map((item, index) => ({ ...item, number: indexNumber(index, locale) }))
}

async function fallbackNav(locale: Locale): Promise<PrimaryNavItem[]> {
  const bindings = await resolveBindings(locale)
  const entries: { slug: Section; label: string }[] = []
  if (bindings.aboutPage?.title) entries.push({ slug: 'about', label: bindings.aboutPage.title })
  if (bindings.projectsCategory?.title) entries.push({ slug: 'projects', label: bindings.projectsCategory.title })
  if (bindings.servicesPage?.title) entries.push({ slug: 'services', label: bindings.servicesPage.title })
  if (bindings.educationCategory?.title) entries.push({ slug: 'education', label: bindings.educationCategory.title })
  if (bindings.blogCategory?.title) entries.push({ slug: 'blog', label: bindings.blogCategory.title })
  if (bindings.contactPage?.title) entries.push({ slug: 'contact', label: bindings.contactPage.title })

  return entries.map((entry, index) => ({
    id: entry.slug,
    href: href(locale, entry.slug),
    label: entry.label,
    number: indexNumber(index, locale),
    external: false,
    newTab: false,
  }))
}

/**
 * The one primary navigation model. Header, mobile menu and the home stage all render
 * this list; with no header saved in the CMS it is built from the content bindings.
 */
export const getPrimaryNavigation = cache(
  async (locale: Locale, site: SiteDescriptor | null): Promise<PrimaryNavItem[]> => {
    try {
      const fromCms = await validateNavItems(await getNav('header', locale), locale, site)
      if (fromCms.length) return fromCms
      return await fallbackNav(locale)
    } catch {
      // The CMS is unreachable: chrome renders without a menu and the page reports its
      // own content state through its error boundary.
      return []
    }
  },
)

export const getFooterNavigation = cache(
  async (locale: Locale, site: SiteDescriptor | null): Promise<PrimaryNavItem[]> => {
    try {
      return await validateNavItems(await getNav('footer', locale), locale, site)
    } catch {
      return []
    }
  },
)

/** The Projects destination for the home stage's direct link, when the menu has one. */
export function projectsShortcut(items: PrimaryNavItem[], locale: Locale): PrimaryNavItem | null {
  return items.find((item) => !item.external && sectionOfPath(item.href, locale) === 'projects') ?? null
}
