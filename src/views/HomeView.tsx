import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { HomeStage } from '@/components/home/HomeStage'
import { getHomePage } from '@/lib/cms'
import { getRenderContext } from '@/lib/context'
import { SECTIONS, copy, href, otherLocale, sectionNumber } from '@/lib/i18n'
import { ogImageUrl } from '@/lib/media'
import { buildMetadata } from '@/lib/seo'
import type { Locale } from '@/lib/types'

/**
 * Runs before first paint: the intro plays once per session, never under
 * reduced motion, and `?intro` forces a replay for review.
 */
const INTRO_SCRIPT = `(function(){try{var d=document.documentElement,k='graphite:intro';if(matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.intro='reduced';return}var f=/[?&]intro(=|&|$)/.test(location.search);if(!f&&sessionStorage.getItem(k)){d.dataset.intro='done';return}sessionStorage.setItem(k,'1');d.dataset.intro='play'}catch(e){document.documentElement.dataset.intro='done'}})()`

export async function homeMetadata(locale: Locale): Promise<Metadata> {
  const ctx = await getRenderContext(locale)
  const page = await getHomePage(locale)
  const other = otherLocale(locale)
  return buildMetadata({
    locale,
    title: page?.meta?.title,
    description: page?.meta?.description,
    path: href(locale),
    alternates: ctx.otherServed ? { [other]: href(other) } : {},
    image: ogImageUrl(page?.meta?.image, ctx.origin),
  })
}

export async function HomeView({ locale }: { locale: Locale }) {
  const ctx = await getRenderContext(locale)
  if (!ctx.served.includes(locale)) notFound()
  const t = copy[locale]
  const other = otherLocale(locale)
  const items = SECTIONS.map((section) => ({
    href: href(locale, section),
    label: t[section],
    number: sectionNumber(section, locale),
  }))
  const language = ctx.otherServed
    ? { href: href(other), label: t.switchLabel, short: t.switchToShort, lang: other }
    : null

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <HomeStage locale={locale} items={items} language={language} />
    </>
  )
}
