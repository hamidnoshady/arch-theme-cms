import '@fontsource-variable/jost/wght.css'
import '@fontsource-variable/manrope/wght.css'
import '@fontsource-variable/vazirmatn/wght.css'
import '@/styles/index.css'

import { Logo } from '@/components/brand/Logo'
import { getSite } from '@/lib/cms'
import { shazdeUiReady } from '@/lib/fonts'
import { interFont } from '@/lib/inter-font'
import { copy } from '@/lib/i18n'
import { shazdeFont } from '@/lib/shazde-font'
import { dirFor, isHexColor } from '@/lib/runtime'
import type { Locale, SiteDescriptor } from '@/lib/types'

/** The CMS default primary; a site that never set a brand colour keeps Graphite navy. */
const PLATFORM_DEFAULT_PRIMARY = '#0f766e'

function brandCss(site: SiteDescriptor | null): string {
  const primary = site?.theme?.primary
  if (!isHexColor(primary) || primary.toLowerCase() === PLATFORM_DEFAULT_PRIMARY) return ''
  return `:root{--color-navy:${primary}}`
}

function Holding({ locale }: { locale: Locale }) {
  const t = copy[locale]
  return (
    <main className="holding">
      <Logo variant="full" label={t.brand} />
      <p className="holding__title">{t.holdingTitle}</p>
      <p className="muted">{t.holdingBody}</p>
    </main>
  )
}

export async function RootDocument({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const site = await getSite()
  const shazdeReady = shazdeUiReady()
  const css = brandCss(site)
  const serving = !site || site.status === 'active'
  const fontClass = `${shazdeFont.variable} ${interFont.variable}`.trim()

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
        {serving ? children : <Holding locale={locale} />}
      </body>
    </html>
  )
}

export async function rootMetadata(locale: Locale) {
  const site = await getSite()
  const t = copy[locale]
  const serving = !site || site.status === 'active'
  return {
    title: { default: t.brand, template: `%s — ${locale === 'fa' ? 'گرافیت' : 'GRAPHITE'}` },
    applicationName: 'GRAPHITE',
    ...(serving ? {} : { robots: { index: false, follow: false } }),
  }
}
