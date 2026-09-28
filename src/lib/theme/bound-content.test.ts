import { beforeEach, describe, expect, it, vi } from 'vitest'

// A tiny fake CMS: enough of /api/site, /api/pages and /api/categories for the lookups.
type Doc = { id: string; slug?: string; title?: string; parent?: string }
const db = {
  site: null as unknown,
  pages: {
    fa: [] as Doc[],
    en: [] as Doc[],
  },
  categories: { fa: [] as Doc[], en: [] as Doc[] },
}

vi.mock('../upstream', () => ({
  cmsJson: async (path: string, search = '') => {
    const params = new URLSearchParams(search)
    const locale = (params.get('locale') ?? 'fa') as 'fa' | 'en'
    if (path === 'site') return { status: 200, data: db.site }
    if (path === 'categories') return { status: 200, data: { docs: db.categories[locale] } }
    if (path === 'pages') {
      const slug = params.get('where[slug][equals]')
      const docs = db.pages[locale].filter((p) => p.slug === slug)
      return { status: 200, data: { docs } }
    }
    const byId = path.match(/^pages\/(.+)$/)
    if (byId) {
      const doc = db.pages[locale].find((p) => p.id === decodeURIComponent(byId[1]!))
      return doc ? { status: 200, data: doc } : { status: 404, data: null }
    }
    return { status: 404, data: null }
  },
}))

import { getHomePage, getSectionCategories, getSectionPage, invalidateCmsCache } from '../cms'

const ABOUT = '0a7f1c6e-1111-4a2b-8c3d-000000000001'
const HOME = '0a7f1c6e-1111-4a2b-8c3d-000000000002'
const WORKS = '0a7f1c6e-1111-4a2b-8c3d-000000000003'
const STALE = '0a7f1c6e-1111-4a2b-8c3d-000000000009'

const site = (bindings: Record<string, unknown>) => ({
  availableLocales: ['fa', 'en'],
  themeRuntime: { bindings },
})

beforeEach(() => {
  invalidateCmsCache()
  db.site = site({})
  db.pages = { fa: [], en: [] }
  db.categories = { fa: [], en: [] }
})

describe('section pages follow the binding, not the slug', () => {
  it('renders the bound page even though its slug is not `about`', async () => {
    db.site = site({ aboutPage: { id: ABOUT, type: 'page', slug: 'درباره-ما' } })
    db.pages.fa = [{ id: ABOUT, slug: 'درباره-ما', title: 'درباره ما' }]
    expect((await getSectionPage('about', 'fa'))?.id).toBe(ABOUT)
  })

  it('does not swap in an unrelated `about` page when the bound page is untranslated', async () => {
    db.site = site({ aboutPage: { id: ABOUT, type: 'page', slug: 'team' } })
    db.pages.fa = [{ id: ABOUT, slug: 'team', title: 'تیم' }]
    db.pages.en = [{ id: 'other', slug: 'about', title: 'Other' }]
    expect(await getSectionPage('about', 'en')).toBeNull()
  })

  it('falls back to the section-key slug when nothing is bound', async () => {
    db.pages.fa = [{ id: 'p1', slug: 'about', title: 'درباره' }]
    expect((await getSectionPage('about', 'fa'))?.id).toBe('p1')
  })

  it('falls back to the section-key slug when the CMS reports the binding as unresolved', async () => {
    db.site = site({ aboutPage: null })
    db.pages.fa = [{ id: 'p1', slug: 'about', title: 'درباره' }]
    expect((await getSectionPage('about', 'fa'))?.id).toBe('p1')
  })

  it('binds the home page too', async () => {
    db.site = site({ homePage: { id: HOME, type: 'page', slug: 'welcome' } })
    db.pages.fa = [
      { id: HOME, slug: 'welcome', title: 'خوش آمدید' },
      { id: 'legacy', slug: 'home', title: 'قدیمی' },
    ]
    expect((await getHomePage('fa'))?.id).toBe(HOME)
  })
})

describe('entry sections follow the bound category', () => {
  it('uses the bound category as the root, whatever its slug', async () => {
    db.site = site({ projectsCategory: { id: WORKS, type: 'category', slug: 'works' } })
    db.categories.fa = [
      { id: WORKS, slug: 'works', title: 'آثار' },
      { id: 'c2', slug: 'houses', title: 'مسکونی', parent: WORKS },
    ]
    const section = await getSectionCategories('projects', 'fa')
    expect(section.root?.id).toBe(WORKS)
    expect(section.children.map((c) => c.id)).toEqual(['c2'])
  })

  it('falls back to the `projects` slug when the bound category no longer exists', async () => {
    db.site = site({ projectsCategory: { id: STALE, type: 'category', slug: 'gone' } })
    db.categories.fa = [{ id: 'legacy', slug: 'projects', title: 'پروژه‌ها' }]
    expect((await getSectionCategories('projects', 'fa')).root?.id).toBe('legacy')
  })
})
