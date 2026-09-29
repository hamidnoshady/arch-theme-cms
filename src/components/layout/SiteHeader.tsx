import { getSite } from '@/lib/cms'
import { copy, href } from '@/lib/i18n'
import { getPrimaryNavigation, navItemActive, type ActiveNav } from '@/lib/navigation'
import { resolveBranding } from '@/lib/theme/branding'
import type { Locale, LocaleLink } from '@/lib/types'

import { SiteHeaderClient } from './SiteHeaderClient'

export async function SiteHeader({
  locale,
  active,
  language,
}: {
  locale: Locale
  active?: ActiveNav | null
  language: LocaleLink | null
}) {
  const t = copy[locale]
  const site = await getSite()
  const branding = resolveBranding(site, locale)
  const nav = await getPrimaryNavigation(locale, site)
  const items = nav.map((item) => ({
    key: item.id,
    href: item.href,
    label: item.label,
    number: item.number,
    current: Boolean(navItemActive(item.href, active)),
    external: item.external,
    newTab: item.newTab,
  }))

  return (
    <SiteHeaderClient
      locale={locale}
      items={items}
      branding={branding}
      homeLabel={t.home}
      language={language}
    />
  )
}
