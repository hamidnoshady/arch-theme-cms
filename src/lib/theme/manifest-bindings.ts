import themeManifest from '../../../eshobe.theme.json'

import type { SiteBindings, SiteDescriptor } from '@/lib/types'

type ManifestBindings = Record<string, string>

const manifestBindings = (): ManifestBindings => {
  const row = themeManifest as { bindings?: ManifestBindings }
  return row.bindings && typeof row.bindings === 'object' ? row.bindings : {}
}

/** Site descriptor bindings win; manifest slug hints fill gaps for transitional deploys. */
export function effectiveBindings(site: SiteDescriptor | null): SiteBindings | null {
  const fromSite = site?.bindings ?? null
  const hints = manifestBindings()
  if (!fromSite && !Object.keys(hints).length) return null
  return {
    homePage: fromSite?.homePage ?? hints.homePage ?? null,
    aboutPage: fromSite?.aboutPage ?? hints.aboutPage ?? null,
    servicesPage: fromSite?.servicesPage ?? hints.servicesPage ?? null,
    contactPage: fromSite?.contactPage ?? hints.contactPage ?? null,
    projectsCategory: fromSite?.projectsCategory ?? hints.projectsCategory ?? null,
    educationCategory: fromSite?.educationCategory ?? hints.educationCategory ?? null,
  }
}
