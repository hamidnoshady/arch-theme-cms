import { effectiveBindings } from './manifest-bindings'

import type { BindingValue, EntryKind, Section, SiteBindings, SiteDescriptor } from '@/lib/types'

/**
 * How the theme finds "its" content in a customer's CMS.
 *
 * Two things are deliberately separate:
 *
 * - **URLs are the theme's.** `/about`, `/projects`, … are fixed routes the theme owns, so
 *   navigation, sitemap and the mobile menu never depend on what a customer typed as a slug.
 * - **Content is the customer's.** Each route is filled by whichever document the site owner
 *   bound to the matching `contentSlots` entry (`GET /api/site` → `themeRuntime.bindings`).
 *   Only when nothing is bound does the theme look for a document whose slug equals the
 *   section key — the manifest's slug hint, kept so a freshly provisioned site works before
 *   anyone opens «تنظیمات پوسته».
 *
 * This module is the only place that knows the slot names. It is pure (no fetching) so the
 * rules can be tested without a CMS.
 */

/** Section route → the manifest content slot that fills it. */
export const SECTION_SLOT = {
  about: 'aboutPage',
  services: 'servicesPage',
  contact: 'contactPage',
  projects: 'projectsCategory',
  education: 'educationCategory',
  blog: 'blogCategory',
} as const satisfies Record<Section, keyof SiteBindings>

/** `home` is a page role too, but it is the site root, not a section route. */
export type PageRole = 'home' | 'about' | 'services' | 'contact'

const PAGE_ROLE_SLOT = {
  home: 'homePage',
  about: 'aboutPage',
  services: 'servicesPage',
  contact: 'contactPage',
} as const satisfies Record<PageRole, keyof SiteBindings>

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** A binding reduced to what a lookup needs: a document id when bound, a slug when only hinted. */
export type BindingRef = { id: string | null; slug: string | null }

const nonEmpty = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null

/**
 * Accepts every shape a binding has arrived in: the resolved object the CMS sends
 * (`{ id, type, slug, title }`), a populated document, a bare id, or a bare slug hint.
 * An id that is not a UUID is treated as a slug, never trusted as an id.
 */
export function bindingRef(value: BindingValue): BindingRef {
  if (!value) return { id: null, slug: null }
  if (typeof value === 'string') {
    return UUID.test(value) ? { id: value, slug: null } : { id: null, slug: nonEmpty(value) }
  }
  const id = nonEmpty(value.id)
  const slug = nonEmpty(value.slug)
  return { id: id && UUID.test(id) ? id : null, slug: slug && !UUID.test(slug) ? slug : null }
}

/** The binding for a section route (or `home`), with the manifest's slug hint as the floor. */
export function sectionRef(site: SiteDescriptor | null, section: Section | 'home'): BindingRef {
  const bindings = effectiveBindings(site)
  const key = section === 'home' ? 'homePage' : SECTION_SLOT[section]
  const ref = bindingRef(bindings?.[key])
  return { id: ref.id, slug: ref.slug ?? (section === 'home' ? null : section) }
}

/** Every category-backed section, so callers do not repeat the list. */
export const ENTRY_KINDS: EntryKind[] = ['projects', 'education', 'blog']

/**
 * Page id → the role that page plays on this site. A page bound to «about» has one canonical
 * URL, `/about`, wherever it is linked from — regardless of its own slug.
 */
export function pageRoleIndex(site: SiteDescriptor | null): Map<string, PageRole> {
  const bindings = effectiveBindings(site)
  const index = new Map<string, PageRole>()
  for (const role of Object.keys(PAGE_ROLE_SLOT) as PageRole[]) {
    const { id } = bindingRef(bindings?.[PAGE_ROLE_SLOT[role]])
    if (id) index.set(id, role)
  }
  return index
}
