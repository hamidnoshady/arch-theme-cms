import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

import { getEntries, getSite, listPublishedPages, sectionPageExists, servedLocales } from '@/lib/cms'
import { canonicalOrigin } from '@/lib/env'
import { SECTIONS, href } from '@/lib/i18n'
import { pageHref } from '@/lib/links'
import { ENTRY_KINDS, pageRoleIndex } from '@/lib/theme/sections'
import { HOME_SLUG } from '@eshobe/site-runtime'
import type { EntryKind, Locale } from '@/lib/types'

type Url = { loc: Record<Locale, string | undefined>; lastModified?: string }

/**
 * Every URL is enumerated with `fallbackLocale=false`, so a locale only gets a
 * URL (and an hreflang alternate) when that translation exists.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = canonicalOrigin()
  const site = await getSite()
  if (!origin || (site && site.status !== 'active')) return []
  const locales = await servedLocales()
  const urls: Url[] = []

  urls.push({ loc: { fa: locales.includes('fa') ? href('fa') : undefined, en: locales.includes('en') ? href('en') : undefined } })

  for (const section of SECTIONS) {
    const loc: Url['loc'] = { fa: undefined, en: undefined }
    for (const locale of locales) {
      const listing = (ENTRY_KINDS as string[]).includes(section)
      if (listing || (await sectionPageExists(section, locale))) loc[locale] = href(locale, section)
    }
    urls.push({ loc })
  }

  const byId = new Map<string, Url>()
  const add = (id: string, locale: Locale, path: string, lastModified?: string | null) => {
    const entry = byId.get(id) ?? { loc: { fa: undefined, en: undefined } }
    entry.loc[locale] = path
    if (lastModified) entry.lastModified = lastModified
    byId.set(id, entry)
  }

  const pages = new Map(await Promise.all(locales.map(async (l) => [l, await listPublishedPages(l)] as const)))
  // Pages with their own route (home + sections) are listed once, at that route — by binding
  // when the site owner made one, else by the legacy reserved slugs.
  const roles = pageRoleIndex(site)
  const reserved = new Set([
    ...roles.keys(),
    ...[...pages.values()]
      .flat()
      .filter((p) => p.slug === HOME_SLUG || (SECTIONS as string[]).includes(p.slug ?? ''))
      .map((p) => p.id),
  ])

  for (const locale of locales) {
    for (const kind of ENTRY_KINDS) {
      for (const post of await getEntries(kind, locale)) {
        add(post.id, locale, href(locale, `${kind}/${encodeURIComponent(post.slug!)}`), post.updatedAt)
      }
    }
    for (const page of pages.get(locale) ?? []) {
      if (!page.slug || reserved.has(page.id)) continue
      add(page.id, locale, pageHref(page.slug, locale), page.updatedAt)
    }
  }
  urls.push(...byId.values())

  return urls.flatMap(({ loc, lastModified }) => {
    const languages = Object.fromEntries(
      Object.entries(loc)
        .filter(([, path]) => path)
        .map(([l, path]) => [l, `${origin}${path}`]),
    )
    return (Object.entries(loc) as [Locale, string | undefined][])
      .filter(([, path]) => path)
      .map(([, path]) => ({
        url: `${origin}${path}`,
        ...(lastModified ? { lastModified } : {}),
        alternates: { languages },
      }))
  })
}
