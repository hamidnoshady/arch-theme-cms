import themeManifest from '../../../eshobe.theme.json'

import type { SiteBindings, SiteDescriptor } from '@/lib/types'

type ManifestBindings = Record<string, string>

/** Slug hints derived from the manifest's content slots: `aboutPage` → `about`. */
const manifestBindings = (): ManifestBindings =>
  Object.fromEntries(
    ((themeManifest as { contentSlots?: { key: string }[] }).contentSlots ?? []).map(({ key }) => [
      key,
      key.replace(/Page$|Category$/, ''),
    ]),
  )

/** Site descriptor bindings win; manifest slug hints fill gaps for transitional deploys. */
export function effectiveBindings(site: SiteDescriptor | null): SiteBindings | null {
  const fromSite = site?.themeRuntime?.bindings ?? null
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
