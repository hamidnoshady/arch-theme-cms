import { describe, expect, it } from 'vitest'

import { navItemActive, projectsShortcut, sectionOfPath, validateNavItems } from './navigation'
import type { NavCollection, Section, SiteDescriptor } from './types'

const ABOUT = '0a7f1c6e-2222-4a2b-8c3d-000000000002'
const SERVICES = '0a7f1c6e-2222-4a2b-8c3d-000000000003'
const site = {
  themeRuntime: { bindings: { aboutPage: { id: ABOUT }, servicesPage: { id: SERVICES } } },
} as unknown as SiteDescriptor

/** What the CMS sends for an English header read with `fallbackLocale=false`. */
const header: NavCollection = {
  navItems: [
    { id: 'a', link: { type: 'reference', label: 'About', reference: { relationTo: 'pages', value: { id: ABOUT, slug: 'about' } } } },
    { id: 'p', link: { type: 'custom', label: 'Projects', url: '/projects' } },
    // Services has no English translation: the bound page still has an English label.
    { id: 's', link: { type: 'reference', label: 'Services', reference: { relationTo: 'pages', value: { id: SERVICES, slug: null } } } },
    // A label nobody translated.
    { id: 'e', link: { type: 'custom', label: null, url: '/education' } },
    // An ordinary page with no English slug.
    { id: 'x', link: { type: 'reference', label: 'Press', reference: { relationTo: 'pages', value: { id: 'x', slug: null } } } },
    { id: 'c', link: { type: 'custom', label: 'Contact', url: '/contact' } },
    { id: 'dup', link: { type: 'custom', label: 'Projects again', url: '/projects' } },
  ],
}

const available = (missing: Section[]) => async (section: Section) => !missing.includes(section)

describe('primary navigation model', () => {
  it('keeps only items that exist in English, at English URLs, numbered without gaps', async () => {
    const items = await validateNavItems(header, 'en', site, available(['services']))
    expect(items.map((i) => [i.label, i.href, i.number])).toEqual([
      ['About', '/en/about', '01'],
      ['Projects', '/en/projects', '02'],
      ['Contact', '/en/contact', '03'],
    ])
  })

  it('never routes every item to the home page', async () => {
    const items = await validateNavItems(header, 'en', site, available([]))
    expect(items.filter((i) => i.href === '/en')).toEqual([])
    expect(new Set(items.map((i) => i.href)).size).toBe(items.length)
  })

  it('numbers Persian items with Persian digits', async () => {
    const fa: NavCollection = { navItems: [{ id: 'p', link: { type: 'custom', label: 'پروژه‌ها', url: '/projects' } }] }
    expect((await validateNavItems(fa, 'fa', site, available([])))[0]).toMatchObject({ href: '/projects', number: '۰۱' })
  })

  it('drops unsafe targets', async () => {
    const bad: NavCollection = { navItems: [{ id: 'j', link: { type: 'custom', label: 'x', url: 'javascript:alert(1)' } }] }
    expect(await validateNavItems(bad, 'en', site, available([]))).toEqual([])
  })

  it('finds the Projects destination for the home stage', async () => {
    const items = await validateNavItems(header, 'en', site, available([]))
    expect(projectsShortcut(items, 'en')?.href).toBe('/en/projects')
    expect(projectsShortcut([], 'en')).toBeNull()
  })

  it('maps a path to its section in the locale', () => {
    expect(sectionOfPath('/en/projects', 'en')).toBe('projects')
    expect(sectionOfPath('/projects', 'en')).toBeNull()
    expect(sectionOfPath('/services/', 'fa')).toBe('services')
  })
})

describe('navItemActive', () => {
  it('marks the exact index route', () => {
    expect(navItemActive('/projects', { path: '/projects', exact: true })).toBe('page')
    expect(navItemActive('/projects', { path: '/projects/foo', exact: true })).toBeUndefined()
  })

  it('highlights parent section on detail pages', () => {
    expect(navItemActive('/projects', { path: '/projects/foo', exact: false })).toBe('true')
  })

  it('ignores the query string', () => {
    expect(navItemActive('/projects?category=a', { path: '/projects', exact: true })).toBe('page')
  })
})
