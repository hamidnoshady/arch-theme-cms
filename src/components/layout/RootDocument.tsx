import '@fontsource-variable/jost/wght.css'
import '@fontsource-variable/manrope/wght.css'
import '@fontsource-variable/vazirmatn/wght.css'
import '@/styles/index.css'

import type { Metadata } from 'next'

import { Logo } from '@/components/brand/Logo'
import { getSite } from '@/lib/cms'
import { shazdeUiReady } from '@/lib/fonts'
import { interFont } from '@/lib/inter-font'
import { copy } from '@/lib/i18n'
import { shazdeFont } from '@/lib/shazde-font'
import { resolveBranding } from '@/lib/theme/branding'
import { siteThemeStyle } from '@/lib/theme/tokens'
import { absoluteMediaUrl, mediaOrigin } from '@/lib/media'
import { dirFor } from '@/lib/locale'
import type { Locale } from '@/lib/types'

function Holding({ locale, branding }: { locale: Locale; branding: ReturnType<typeof resolveBranding> }) {
  const t = copy[locale]
  return (
    <main className="holding">
      <Logo variant="full" label={branding.brandLabel} branding={branding} />
      <p className="holding__title">{t.holdingTitle}</p>
      <p className="muted">{t.holdingBody}</p>
    </main>
  )
}

export async function RootDocument({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const site = await getSite()
  const branding = resolveBranding(site, locale)
  const shazdeReady = shazdeUiReady()
  const css = siteThemeStyle(site)
  const serving = !site || site.status === 'active'
  const fontClass = `${shazdeFont.variable} ${interFont.variable}`.trim()
  const origin = mediaOrigin(site)

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={fontClass}
      data-fonts={shazdeReady ? 'shazde' : 'fallback'}
      suppressHydrationWarning
    >
      <body>
        {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
        {serving ? children : <Holding locale={locale} branding={branding} />}
      </body>
    </html>
  )
}

export async function rootMetadata(locale: Locale): Promise<Metadata> {
  const site = await getSite()
  const branding = resolveBranding(site, locale)
  const serving = !site || site.status === 'active'
  const origin = mediaOrigin(site)
  const faviconUrl =
    branding.favicon && typeof branding.favicon === 'object' ? branding.favicon.url : null
  const favicon = faviconUrl
    ? absoluteMediaUrl(faviconUrl, origin)
    : '/graphite-logo.svg'

  return {
    title: { default: branding.siteName, template: `%s — ${branding.siteName}` },
    applicationName: branding.siteName,
    icons: favicon ? { icon: favicon, shortcut: favicon } : undefined,
    ...(serving ? {} : { robots: { index: false, follow: false } }),
  }
}
