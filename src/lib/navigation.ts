import { cache } from 'react'

import { getNav } from '@/lib/cms'
import { href, indexNumber } from '@/lib/i18n'
import { resolveLink, safeHref } from '@/lib/links'
import { resolveBindings } from '@/lib/theme/bindings'
import { pageRoleIndex } from '@/lib/theme/sections'
import type { Locale, SiteDescriptor } from '@/lib/types'

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
  return path.replace(/\/+$/, '') || '/'
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

async function fallbackNav(locale: Locale): Promise<PrimaryNavItem[]> {
  const bindings = await resolveBindings(locale)
  const entries: { slug: string; label: string }[] = []
  if (bindings.aboutPage?.title) entries.push({ slug: 'about', label: bindings.aboutPage.title! })
  if (bindings.projectsCategory?.title) entries.push({ slug: 'projects', label: bindings.projectsCategory.title! })
  if (bindings.servicesPage?.title) entries.push({ slug: 'services', label: bindings.servicesPage.title! })
  if (bindings.educationCategory?.title) entries.push({ slug: 'education', label: bindings.educationCategory.title! })
  if (bindings.blogCategory?.title) entries.push({ slug: 'blog', label: bindings.blogCategory.title! })
  if (bindings.contactPage?.title) entries.push({ slug: 'contact', label: bindings.contactPage.title! })

  return entries.map((entry, index) => ({
    id: entry.slug,
    href: href(locale, entry.slug),
    label: entry.label,
    number: indexNumber(index, locale),
    external: false,
    newTab: false,
  }))
}

export const getPrimaryNavigation = cache(
  async (locale: Locale, site: SiteDescriptor | null): Promise<PrimaryNavItem[]> => {
    const header = await getNav('header', locale)
    const roles = pageRoleIndex(site)
    const fromCms = (header?.navItems ?? [])
      .map((item, index) => {
        const label = item.link?.label?.trim()
        const resolved = resolveLink(item.link, locale, roles)
        const href = resolved?.href && safeHref(resolved.href)
        if (!label || !href) return null
        return {
          id: item.id ?? `${index}-${href}`,
          href,
          label,
          number: indexNumber(index, locale),
          external: resolved.external,
          newTab: resolved.newTab,
        }
      })
      .filter((item): item is PrimaryNavItem => Boolean(item))

    if (fromCms.length) return fromCms
    return fallbackNav(locale)
  },
)
