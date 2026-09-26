import { getPageById, getPageBySlug, getSectionCategories } from '@/lib/cms'
import { HOME_SLUG } from '@eshobe/site-runtime'
import type { Category, Locale, Page, SiteBindings, SiteDescriptor } from '@/lib/types'

export type ContentBindings = {
  homePage: Page | null
  aboutPage: Page | null
  servicesPage: Page | null
  contactPage: Page | null
  projectsCategory: Category | null
  educationCategory: Category | null
}

const refId = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value && 'id' in value) return String((value as { id: unknown }).id)
  return null
}

async function pageBinding(
  bindings: SiteBindings | null | undefined,
  key: keyof SiteBindings,
  legacySlug: string,
  locale: Locale,
): Promise<Page | null> {
  const id = refId(bindings?.[key])
  if (id) {
    const byId = await getPageById(id, locale)
    if (byId) return byId
  }
  return getPageBySlug(legacySlug, locale)
}

async function categoryBinding(
  bindings: SiteBindings | null | undefined,
  key: 'projectsCategory' | 'educationCategory',
  legacySlug: 'projects' | 'education',
  locale: Locale,
): Promise<Category | null> {
  const id = refId(bindings?.[key])
  const { root } = await getSectionCategories(legacySlug, locale)
  if (id) {
    if (root?.id === id) return root
    // If binding points at a child category, still return the section root for routing.
  }
  return root
}

/** Resolved CMS content bindings with legacy slug fallbacks (single compatibility surface). */
export async function resolveBindings(
  site: SiteDescriptor | null,
  locale: Locale,
): Promise<ContentBindings> {
  const bindings = site?.bindings ?? null
  const [homePage, aboutPage, servicesPage, contactPage, projectsCategory, educationCategory] =
    await Promise.all([
      pageBinding(bindings, 'homePage', HOME_SLUG, locale),
      pageBinding(bindings, 'aboutPage', 'about', locale),
      pageBinding(bindings, 'servicesPage', 'services', locale),
      pageBinding(bindings, 'contactPage', 'contact', locale),
      categoryBinding(bindings, 'projectsCategory', 'projects', locale),
      categoryBinding(bindings, 'educationCategory', 'education', locale),
    ])
  return { homePage, aboutPage, servicesPage, contactPage, projectsCategory, educationCategory }
}
