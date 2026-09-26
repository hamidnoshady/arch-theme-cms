import { cache } from 'react'

import { getSite, servedLocales } from './cms'
import { otherLocale } from './i18n'
import { mediaOrigin } from './media'
import { resolveBranding, type ResolvedBranding } from './theme/branding'
import { resolveRuntimeSettings } from './theme/settings'
import type { GraphiteRuntimeSettings } from './theme/settings'
import type { Locale, SiteDescriptor } from './types'

export type RenderContext = {
  locale: Locale
  site: SiteDescriptor | null
  origin: string
  branding: ResolvedBranding
  settings: GraphiteRuntimeSettings
  /** Block allowlist from the site descriptor; null when no CMS is configured. */
  allowed: string[] | null
  served: Locale[]
  otherServed: boolean
}

export const getRenderContext = cache(async (locale: Locale): Promise<RenderContext> => {
  const [site, served] = await Promise.all([getSite(), servedLocales()])
  return {
    locale,
    site,
    origin: mediaOrigin(site),
    branding: resolveBranding(site, locale),
    settings: resolveRuntimeSettings(site?.runtimeSettings),
    allowed: site?.blocks?.length ? site.blocks : null,
    served,
    otherServed: served.includes(otherLocale(locale)),
  }
})
