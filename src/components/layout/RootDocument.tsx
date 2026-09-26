import { preload } from 'react-dom'

import '@fontsource-variable/jost/wght.css'
import '@fontsource-variable/manrope/wght.css'
import '@fontsource-variable/vazirmatn/wght.css'
import '@/styles/index.css'

import { Logo } from '@/components/brand/Logo'
import { getSite } from '@/lib/cms'
import { shazdeCss, shazdeFiles } from '@/lib/fonts'
import { copy } from '@/lib/i18n'
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
  const fonts = shazdeFiles()
  const css = shazdeCss(fonts) + brandCss(site)
  const serving = !site || site.status === 'active'
  const face = fonts.find((f) => f.weight.includes(' ') || f.weight === '400')
  if (face && locale === 'fa') {
    preload(`/fonts/${face.file}`, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
  }

  return (
    <html lang={locale} dir={dirFor(locale)} data-fonts={fonts.length ? 'shazde' : 'fallback'} suppressHydrationWarning>
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
