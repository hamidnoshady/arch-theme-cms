import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { HomeStage } from '@/components/home/HomeStage'
import { getHomePage, getSite } from '@/lib/cms'
import { getRenderContext } from '@/lib/context'
import { copy, href, otherLocale } from '@/lib/i18n'
import { getPrimaryNavigation } from '@/lib/navigation'
import { ogImageUrl } from '@/lib/media'
import { buildMetadata } from '@/lib/seo'
import type { Locale } from '@/lib/types'

/**
 * Runs before first paint: the intro plays once per session, never under
 * reduced motion, and `?intro` forces a replay for review.
 */
const introScript = (enabled: boolean, durationMs: number) =>
  `(function(){try{var d=document.documentElement,k='graphite:intro';if(!${enabled ? 'true' : 'false'}||matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.intro='reduced';return}var f=/[?&]intro(=|&|$)/.test(location.search);if(!f&&sessionStorage.getItem(k)){d.dataset.intro='done';return}sessionStorage.setItem(k,'1');d.dataset.intro='play';d.style.setProperty('--intro-duration','${durationMs}ms')}catch(e){document.documentElement.dataset.intro='done'}})()`

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
    image: ogImageUrl(page?.meta?.image, ctx.origin) ?? ogImageUrl(ctx.branding.defaultOgImage, ctx.origin),
    siteName: ctx.branding.siteName,
  })
}

export async function HomeView({ locale }: { locale: Locale }) {
  const ctx = await getRenderContext(locale)
  if (!ctx.served.includes(locale)) notFound()
  const t = copy[locale]
  const other = otherLocale(locale)
  const site = await getSite()
  const nav = await getPrimaryNavigation(locale, site)
  const items = nav.map((item) => ({
    href: item.href,
    label: item.label,
    number: ctx.settings.showSectionNumbers ? item.number : '',
  }))
  const language = ctx.otherServed
    ? { href: href(other), label: t.switchLabel, short: t.switchToShort, lang: other }
    : null

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: introScript(ctx.settings.introAnimation, ctx.settings.introDurationMs),
        }}
      />
      <HomeStage
        locale={locale}
        items={items}
        language={language}
        branding={ctx.branding}
        mediaOrigin={ctx.origin}
        introDurationMs={ctx.settings.introDurationMs}
      />
    </>
  )
}
