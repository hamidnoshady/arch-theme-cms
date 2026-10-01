import '@fontsource-variable/vazirmatn/wght.css'
import '@/styles/index.css'

import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Logo } from '@/components/brand/Logo'
import { RouteProgress } from '@/components/layout/RouteProgress'
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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
        {/* Outside the page shell: the drawer pushes `.shell`, which would carry a
            fixed-position rule along with it. The boundary lets a statically
            prerendered page (404, _not-found) bail out to the client rather than
            fail: the rule reads the query string, and it is fixed-position, so its
            absence from the prerendered HTML cannot shift anything. */}
        {serving ? (
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
        ) : null}
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
  const favicon = faviconUrl ? absoluteMediaUrl(faviconUrl, origin) : null

  return {
    title: { default: branding.siteName, template: `%s — ${branding.siteName}` },
    applicationName: branding.siteName,
    icons: favicon ? { icon: favicon, shortcut: favicon } : undefined,
    ...(serving ? {} : { robots: { index: false, follow: false } }),
  }
}
