import type { Metadata } from 'next'

import { canonicalOrigin } from './env'
import { copy } from './i18n'
import type { Alternates, Locale } from './types'

const ogLocale: Record<Locale, string> = { fa: 'fa_IR', en: 'en_US' }

export function metadataBase(): URL | undefined {
  const origin = canonicalOrigin()
  try {
    return origin ? new URL(origin) : undefined
  } catch {
    return undefined
  }
}

/**
 * Canonical is the current locale's path; `alternates` lists only locales that
 * really have a translation, so an untranslated page never advertises a URL that
 * would 404 (THEME_API §13).
 */
export function buildMetadata({
  locale,
  title,
  description,
  path,
  alternates,
  image,
  type = 'website',
  noindex = false,
  publishedTime,
}: {
  locale: Locale
  title?: string | null
  description?: string | null
  path: string
  alternates?: Alternates
  image?: string
  type?: 'website' | 'article'
  noindex?: boolean
  publishedTime?: string | null
}): Metadata {
  const t = copy[locale]
  const desc = description?.trim() || t.brand
  const languages: Record<string, string> = {}
  const langs = { ...alternates, [locale]: path }
  for (const [code, target] of Object.entries(langs)) if (target) languages[code] = target
  if (languages.fa) languages['x-default'] = languages.fa

  return {
    metadataBase: metadataBase(),
    title: title?.trim() ? title.trim() : { absolute: t.brand },
    description: desc,
    alternates: { canonical: path, languages },
    openGraph: {
      type,
      title: title?.trim() || t.brand,
      description: desc,
      url: path,
      siteName: 'GRAPHITE',
      locale: ogLocale[locale],
      alternateLocale: Object.keys(langs)
        .filter((l) => l !== locale && (l === 'fa' || l === 'en'))
        .map((l) => ogLocale[l as Locale]),
      ...(image ? { images: [{ url: image }] } : {}),
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary' },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  }
}
