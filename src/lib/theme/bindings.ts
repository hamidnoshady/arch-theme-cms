import { getHomePage, getSectionCategories, getSectionPage } from '@/lib/cms'

import type { Category, Locale, Page } from '@/lib/types'

export type ContentBindings = {
  homePage: Page | null
  aboutPage: Page | null
  servicesPage: Page | null
  contactPage: Page | null
  projectsCategory: Category | null
  educationCategory: Category | null
  blogCategory: Category | null
}

/**
 * The documents behind every content slot, in `locale`. There is no second resolution path:
 * this calls the same lookups the routes use, so navigation can never point at a page the
 * route would not render (see `sections.ts` for the binding rules).
 */
export async function resolveBindings(locale: Locale): Promise<ContentBindings> {
  const [homePage, aboutPage, servicesPage, contactPage, projects, education, blog] = await Promise.all([
    getHomePage(locale),
    getSectionPage('about', locale),
    getSectionPage('services', locale),
    getSectionPage('contact', locale),
    getSectionCategories('projects', locale),
    getSectionCategories('education', locale),
    getSectionCategories('blog', locale),
  ])
  return {
    homePage,
    aboutPage,
    servicesPage,
    contactPage,
    projectsCategory: projects.root,
    educationCategory: education.root,
    blogCategory: blog.root,
  }
}
